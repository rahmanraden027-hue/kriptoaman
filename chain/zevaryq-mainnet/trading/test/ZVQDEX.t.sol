// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../contracts/ZVQFactory.sol";
import "../contracts/ZVQPair.sol";
import "../contracts/ZVQRouter.sol";
import "./MockToken.sol";

interface VmZVQ {
    function deal(address who, uint256 newBalance) external;
    function warp(uint256 newTimestamp) external;
}

contract ZVQDEXTest {
    VmZVQ internal constant vm = VmZVQ(address(uint160(uint256(keccak256("hevm cheat code")))));

    WZVQ internal wzvq;
    ZVQFactory internal factory;
    ZVQRouter internal router;
    MockToken internal tokenA;
    MockToken internal tokenB;

    uint256 internal constant DEADLINE = type(uint256).max;

    function setUp() public {
        wzvq = new WZVQ();
        factory = new ZVQFactory();
        router = new ZVQRouter(address(factory), address(wzvq));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        vm.deal(address(this), 1_000_000 ether);
    }

    receive() external payable {}

    function _path(address a, address b) internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = a;
        path[1] = b;
    }

    function testRouterIdentityAndWalletCompatibilityAliases() public view {
        require(router.factory() == address(factory), "factory mismatch");
        require(router.WZVQ() == address(wzvq), "WZVQ mismatch");
        require(router.WETH() == address(wzvq), "WETH compatibility alias mismatch");
        require(keccak256(bytes(wzvq.symbol())) == keccak256(bytes("WZVQ")), "symbol mismatch");
        require(wzvq.decimals() == 18, "decimals mismatch");
    }

    function testWZVQWrapUnwrapMaintainsBacking() public {
        wzvq.deposit{value: 5 ether}();
        require(wzvq.balanceOf(address(this)) == 5 ether, "wrapped balance mismatch");
        require(wzvq.totalSupply() == 5 ether, "supply mismatch");
        require(address(wzvq).balance == 5 ether, "backing mismatch");
        wzvq.withdraw(2 ether);
        require(wzvq.balanceOf(address(this)) == 3 ether, "unwrap balance mismatch");
        require(address(wzvq).balance == wzvq.totalSupply(), "backing after unwrap");
    }

    function testFactoryCreatesUniquePair() public {
        address pair = factory.createPair(address(tokenA), address(tokenB));
        require(pair != address(0), "pair missing");
        require(factory.getPair(address(tokenB), address(tokenA)) == pair, "reverse pair missing");
        require(factory.allPairsLength() == 1, "pair count");
        (bool ok,) =
            address(factory).call(abi.encodeWithSelector(factory.createPair.selector, address(tokenA), address(tokenB)));
        require(!ok, "duplicate pair accepted");
    }

    function testAddLiquidityAndGetAmountsOut() public {
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            10_000 ether,
            10_000 ether,
            10_000 ether,
            address(this),
            DEADLINE
        );

        address[] memory path = _path(address(tokenA), address(tokenB));
        uint256[] memory amounts = router.getAmountsOut(100 ether, path);
        require(amounts.length == 2, "quote length");
        require(amounts[0] == 100 ether, "quote input");
        require(amounts[1] > 0 && amounts[1] < 100 ether, "quote output");
    }

    function testTokenToTokenSwapUsesQuotedOutput() public {
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            10_000 ether,
            10_000 ether,
            10_000 ether,
            address(this),
            DEADLINE
        );

        address[] memory path = _path(address(tokenA), address(tokenB));
        uint256[] memory quoteAmounts = router.getAmountsOut(100 ether, path);
        uint256 beforeBalance = tokenB.balanceOf(address(this));

        uint256[] memory actual =
            router.swapExactTokensForTokens(100 ether, quoteAmounts[1], path, address(this), DEADLINE);

        require(actual[1] == quoteAmounts[1], "swap quote mismatch");
        require(tokenB.balanceOf(address(this)) == beforeBalance + actual[1], "output missing");
    }

    function testNativeZVQSwapAndV2AliasBothWork() public {
        router.addLiquidityZVQ{value: 10_000 ether}(
            address(tokenA), 10_000 ether, 10_000 ether, 10_000 ether, address(this), DEADLINE
        );

        address[] memory path = _path(address(wzvq), address(tokenA));
        uint256[] memory quoteAmounts = router.getAmountsOut(10 ether, path);

        uint256 beforeBalance = tokenA.balanceOf(address(this));
        uint256[] memory explicitAmounts =
            router.swapExactZVQForTokens{value: 10 ether}(quoteAmounts[1] * 99 / 100, path, address(this), DEADLINE);
        require(tokenA.balanceOf(address(this)) == beforeBalance + explicitAmounts[1], "explicit native swap failed");

        uint256[] memory secondQuote = router.getAmountsOut(10 ether, path);
        uint256[] memory compatAmounts =
            router.swapExactETHForTokens{value: 10 ether}(secondQuote[1] * 99 / 100, path, address(this), DEADLINE);
        require(compatAmounts[1] > 0, "compat native swap failed");
        require(address(router).balance == 0, "router retained native");
    }

    function testTokenToNativeZVQSwap() public {
        router.addLiquidityZVQ{value: 10_000 ether}(
            address(tokenA), 10_000 ether, 10_000 ether, 10_000 ether, address(this), DEADLINE
        );

        address[] memory path = _path(address(tokenA), address(wzvq));
        uint256[] memory quoteAmounts = router.getAmountsOut(100 ether, path);
        uint256 nativeBefore = address(this).balance;

        uint256[] memory actual =
            router.swapExactTokensForZVQ(100 ether, quoteAmounts[1] * 99 / 100, path, address(this), DEADLINE);

        require(address(this).balance == nativeBefore + actual[1], "native output missing");
        require(address(router).balance == 0, "router retained native");
    }

    function testSlippageAndExpiredDeadlineFailAtomically() public {
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            10_000 ether,
            10_000 ether,
            10_000 ether,
            address(this),
            DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = ZVQPair(pair).getReserves();
        address[] memory path = _path(address(tokenA), address(tokenB));

        (bool slippageOk,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector, 100 ether, 10_000 ether, path, address(this), DEADLINE
                )
            );
        require(!slippageOk, "slippage bypassed");

        vm.warp(100);
        (bool expiredOk,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector, 100 ether, 1, path, address(this), uint256(99)
                )
            );
        require(!expiredOk, "expired swap accepted");

        (uint112 r0After, uint112 r1After,) = ZVQPair(pair).getReserves();
        require(r0After == r0Before && r1After == r1Before, "failed swap changed reserves");
    }

    function testRouterRejectsMultiHopAndZeroRecipient() public {
        address[] memory multi = new address[](3);
        multi[0] = address(tokenA);
        multi[1] = address(wzvq);
        multi[2] = address(tokenB);

        (bool pathOk,) =
            address(router).staticcall(abi.encodeWithSelector(router.getAmountsOut.selector, 1 ether, multi));
        require(!pathOk, "multi-hop accepted");

        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            10_000 ether,
            10_000 ether,
            10_000 ether,
            address(this),
            DEADLINE
        );
        address[] memory path = _path(address(tokenA), address(tokenB));
        (bool recipientOk,) = address(router)
            .call(
                abi.encodeWithSelector(router.swapExactTokensForTokens.selector, 1 ether, 1, path, address(0), DEADLINE)
            );
        require(!recipientOk, "zero recipient accepted");
    }

    function testRemoveLiquidityReturnsAssets() public {
        (,, uint256 liquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            10_000 ether,
            10_000 ether,
            10_000 ether,
            address(this),
            DEADLINE
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        ZVQPair(pair).approve(address(router), liquidity);

        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 1, 1, address(this), DEADLINE);
        require(amountA > 0 && amountB > 0, "liquidity not returned");
    }
}
