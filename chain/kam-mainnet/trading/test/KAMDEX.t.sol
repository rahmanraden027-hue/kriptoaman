// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";
import "./MockToken.sol";
import "./MockWKAM.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
}

contract KAMDEXTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    KAMFactory factory;
    KAMRouter router;
    MockToken tokenA;
    MockToken tokenB;
    MockWKAM mockWKAM;

    receive() external payable {}

    function setUp() public {
        factory = new KAMFactory();
        mockWKAM = new MockWKAM();
        router = new KAMRouter(address(factory), address(mockWKAM));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");
        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        vm.deal(address(this), 1_000_000 ether);
    }

    function deadline() internal view returns (uint256) {
        return block.timestamp + 1 hours;
    }

    function testRouterPinsFactoryAndWKAM() public view {
        require(router.factory() == address(factory), "factory mismatch");
        require(router.WKAM() == address(mockWKAM), "WKAM mismatch");
    }

    function testCreatePairOnce() public {
        address pair = factory.createPair(address(tokenA), address(tokenB));
        require(pair != address(0), "pair missing");
        require(factory.getPair(address(tokenA), address(tokenB)) == pair, "forward mapping");
        require(factory.getPair(address(tokenB), address(tokenA)) == pair, "reverse mapping");
        require(factory.allPairsLength() == 1, "pair count");
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
            deadline()
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        require(liquidity > 0, "no liquidity");
        require(KAMPair(pair).balanceOf(address(this)) == liquidity, "lp balance");
        (uint112 r0, uint112 r1,) = KAMPair(pair).getReserves();
        require(r0 > 0 && r1 > 0, "reserves missing");
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
            deadline()
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = KAMPair(pair).getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);
        uint256 bBefore = tokenB.balanceOf(address(this));

        uint256 out =
            router.swapExactTokensForTokens(100 ether, 1, address(tokenA), address(tokenB), address(this), deadline());
        require(out > 0, "no output");
        require(tokenB.balanceOf(address(this)) == bBefore + out, "output mismatch");

        (uint112 r0After, uint112 r1After,) = KAMPair(pair).getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);
        require(kAfter >= kBefore, "product decreased");
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
            deadline()
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        KAMPair(pair).approve(address(router), liquidity);
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));
        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 1, 1, address(this), deadline());
        require(amountA > 0 && amountB > 0, "no assets returned");
        require(tokenA.balanceOf(address(this)) > aBefore, "A not returned");
        require(tokenB.balanceOf(address(this)) > bBefore, "B not returned");
    }

    function testNativeKAMLiquidityWrapAndUnwrap() public {
        uint256 nativeBefore = address(this).balance;
        (uint256 amountToken, uint256 amountKAM, uint256 liquidity) = router.addLiquidityKAM{value: 10 ether}(
            address(tokenA), 10_000 ether, 10_000 ether, 10 ether, address(this), deadline()
        );
        require(amountToken == 10_000 ether, "token amount");
        require(amountKAM == 10 ether, "KAM amount");
        require(liquidity > 0, "no LP");

        address pair = factory.getPair(address(tokenA), address(mockWKAM));
        require(pair != address(0), "KAM pair missing");
        require(mockWKAM.balanceOf(pair) == 10 ether, "WKAM not deposited");

        KAMPair(pair).approve(address(router), liquidity);
        (uint256 tokenOut, uint256 kamOut) =
            router.removeLiquidityKAM(address(tokenA), liquidity, 1, 1, address(this), deadline());
        require(tokenOut > 0 && kamOut > 0, "remove failed");
        require(address(this).balance > nativeBefore - 10 ether, "KAM not unwrapped");
    }

    function testNativeKAMSwapRoundTripRoutes() public {
        router.addLiquidityKAM{value: 100 ether}(
            address(tokenA), 100_000 ether, 100_000 ether, 100 ether, address(this), deadline()
        );

        uint256 tokenBefore = tokenA.balanceOf(address(this));
        uint256 tokenOut = router.swapExactKAMForTokens{value: 1 ether}(1, address(tokenA), address(this), deadline());
        require(tokenOut > 0, "KAM to token output");
        require(tokenA.balanceOf(address(this)) == tokenBefore + tokenOut, "KAM to token balance");

        uint256 kamBefore = address(this).balance;
        uint256 kamOut = router.swapExactTokensForKAM(100 ether, 1, address(tokenA), address(this), deadline());
        require(kamOut > 0, "token to KAM output");
        require(address(this).balance == kamBefore + kamOut, "token to KAM balance");
    }

    function testExpiredTransactionReverts() public {
        vm.warp(1000);
        vm.expectRevert(bytes("KAMRouter: EXPIRED"));
        router.addLiquidity(address(tokenA), address(tokenB), 1 ether, 1 ether, 1 ether, 1 ether, address(this), 999);
    }

    function testQuoteAndFeeMath() public view {
        require(router.quote(10 ether, 100 ether, 200 ether) == 20 ether, "quote");
        uint256 out = router.getAmountOut(10 ether, 100 ether, 100 ether);
        require(out > 9 ether && out < 10 ether, "fee math");
    }
}
