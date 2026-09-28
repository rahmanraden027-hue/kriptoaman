// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../dex/ZVQFactory.sol";
import "../dex/ZVQRouter.sol";
import "./MockToken.sol";

interface VmAudit {
    function warp(uint256 newTimestamp) external;
    function deal(address who, uint256 newBalance) external;
}

contract ZVQDEXTest {
    VmAudit internal constant vm = VmAudit(address(uint160(uint256(keccak256("hevm cheat code")))));

    ZVQFactory factory;
    ZVQRouter router;
    WZVQ canonicalWZVQ;
    MockToken tokenA;
    MockToken tokenB;

    uint256 internal constant DEADLINE = type(uint256).max;

    function setUp() public {
        factory = new ZVQFactory();
        canonicalWZVQ = new WZVQ();
        router = new ZVQRouter(address(factory), address(canonicalWZVQ));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");
        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
    }

    function testRouterPinsFactoryAndCanonicalWZVQ() public view {
        require(router.factory() == address(factory), "factory mismatch");
        require(router.WZVQ() == address(canonicalWZVQ), "WZVQ mismatch");
        require(keccak256(bytes(canonicalWZVQ.symbol())) == keccak256(bytes("WZVQ")), "symbol mismatch");
        require(canonicalWZVQ.decimals() == 18, "decimals mismatch");
        require(canonicalWZVQ.totalSupply() == 0, "unexpected initial supply");
    }

    function testCreatePairOnce() public {
        address pair = factory.createPair(address(tokenA), address(tokenB));
        require(pair != address(0), "pair missing");
        require(factory.getPair(address(tokenA), address(tokenB)) == pair, "forward mapping");
        require(factory.getPair(address(tokenB), address(tokenA)) == pair, "reverse mapping");
        require(factory.allPairsLength() == 1, "pair count");
    }

    function testFactoryRejectsDuplicatePair() public {
        factory.createPair(address(tokenA), address(tokenB));
        (bool ok,) =
            address(factory).call(abi.encodeWithSelector(factory.createPair.selector, address(tokenA), address(tokenB)));
        require(!ok, "duplicate pair accepted");
        require(factory.allPairsLength() == 1, "duplicate changed pair count");
    }

    function testFactoryRejectsIdenticalAndZeroAddressPairs() public {
        (bool identicalOk,) =
            address(factory).call(abi.encodeWithSelector(factory.createPair.selector, address(tokenA), address(tokenA)));
        require(!identicalOk, "identical pair accepted");

        (bool zeroOk,) =
            address(factory).call(abi.encodeWithSelector(factory.createPair.selector, address(0), address(tokenA)));
        require(!zeroOk, "zero address pair accepted");
    }

    function testAddLiquidityMintsLP() public {
        (,, uint256 liquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            10_000 ether,
            20_000 ether,
            10_000 ether,
            20_000 ether,
            address(this),
            DEADLINE
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        require(liquidity > 0, "no liquidity");
        require(ZVQPair(pair).balanceOf(address(this)) == liquidity, "lp balance");
        (uint112 r0, uint112 r1,) = ZVQPair(pair).getReserves();
        require(r0 > 0 && r1 > 0, "reserves missing");
    }

    function testInitialLiquidityRejectsMinimumAboveDesired() public {
        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    100 ether,
                    100 ether,
                    101 ether,
                    100 ether,
                    address(this),
                    DEADLINE
                )
            );
        require(!ok, "initial liquidity ignored minimum");
    }

    function testExpiredDeadlineRejected() public {
        vm.warp(100);
        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    100 ether,
                    100 ether,
                    100 ether,
                    100 ether,
                    address(this),
                    99
                )
            );
        require(!ok, "expired liquidity transaction accepted");
        require(factory.allPairsLength() == 0, "expired call created pair");
    }

    function testAddLiquidityRejectsImpossibleMinimum() public {
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

        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    1_000 ether,
                    1_000 ether,
                    1_001 ether,
                    1_001 ether,
                    address(this),
                    DEADLINE
                )
            );
        require(!ok, "impossible minimum accepted");
    }

    function testSwapPreservesProductWithFee() public {
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
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);
        uint256 bBefore = tokenB.balanceOf(address(this));

        uint256 out =
            router.swapExactTokensForTokens(100 ether, 1, address(tokenA), address(tokenB), address(this), DEADLINE);
        require(out > 0, "no output");
        require(tokenB.balanceOf(address(this)) == bBefore + out, "output mismatch");

        (uint112 r0After, uint112 r1After,) = ZVQPair(pair).getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);
        require(kAfter >= kBefore, "product decreased");
    }

    function testSwapRejectsExcessiveMinimumOutput() public {
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

        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector,
                    100 ether,
                    1_000 ether,
                    address(tokenA),
                    address(tokenB),
                    address(this),
                    DEADLINE
                )
            );
        require(!ok, "slippage floor bypassed");
    }

    function testSwapRejectsMissingPair() public {
        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector,
                    100 ether,
                    1,
                    address(tokenA),
                    address(tokenB),
                    address(this),
                    DEADLINE
                )
            );
        require(!ok, "missing pair accepted");
    }

    function testRemoveLiquidityReturnsBothAssets() public {
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
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));
        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 1, 1, address(this), DEADLINE);
        require(amountA > 0 && amountB > 0, "no assets returned");
        require(tokenA.balanceOf(address(this)) > aBefore, "A not returned");
        require(tokenB.balanceOf(address(this)) > bBefore, "B not returned");
    }

    function testRemoveLiquidityRejectsWithoutApproval() public {
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

        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.removeLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    liquidity,
                    1,
                    1,
                    address(this),
                    DEADLINE
                )
            );
        require(!ok, "LP removal without approval accepted");
    }


    function testWalletQuoteRouteMatchesRouterMath() public {
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
        (uint112 r0, uint112 r1,) = ZVQPair(pair).getReserves();
        (uint256 reserveIn, uint256 reserveOut) =
            address(tokenA) < address(tokenB) ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint256[] memory amounts = router.getAmountsOut(100 ether, path);

        require(amounts.length == 2, "quote path length");
        require(amounts[0] == 100 ether, "quote input");
        require(amounts[1] == router.getAmountOut(100 ether, reserveIn, reserveOut), "quote output");
    }

    function testWalletNativeZVQToTokenSurface() public {
        vm.deal(address(this), 10_000 ether);
        router.addLiquidityZVQ{value: 1_000 ether}(
            address(tokenA),
            1_000 ether,
            1_000 ether,
            1_000 ether,
            address(this),
            DEADLINE
        );

        uint256 tokenBefore = tokenA.balanceOf(address(this));
        uint256 out = router.swapExactZVQForTokens{value: 10 ether}(1, address(tokenA), address(this), DEADLINE);

        require(out > 0, "no token output");
        require(tokenA.balanceOf(address(this)) == tokenBefore + out, "token output mismatch");
        require(address(router).balance == 0, "router retained native ZVQ");
        require(address(canonicalWZVQ).balance == canonicalWZVQ.totalSupply(), "WZVQ backing mismatch");
    }

    function testWalletTokenToNativeZVQSurface() public {
        vm.deal(address(this), 10_000 ether);
        router.addLiquidityZVQ{value: 1_000 ether}(
            address(tokenA),
            1_000 ether,
            1_000 ether,
            1_000 ether,
            address(this),
            DEADLINE
        );

        address recipient = address(0xBEEF);
        uint256 nativeBefore = recipient.balance;
        uint256 out =
            router.swapExactTokensForZVQ(10 ether, 1, address(tokenA), recipient, DEADLINE);

        require(out > 0, "no native output");
        require(recipient.balance == nativeBefore + out, "native output mismatch");
        require(address(router).balance == 0, "router retained native ZVQ");
        require(address(canonicalWZVQ).balance == canonicalWZVQ.totalSupply(), "WZVQ backing mismatch");
    }

    function testQuoteAndFeeMath() public view {
        require(router.quote(10 ether, 100 ether, 200 ether) == 20 ether, "quote");
        uint256 out = router.getAmountOut(10 ether, 100 ether, 100 ether);
        require(out > 9 ether && out < 10 ether, "fee math");
    }
}
