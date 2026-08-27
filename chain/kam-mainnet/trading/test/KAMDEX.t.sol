// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";
import "./MockToken.sol";

contract KAMDEXTest {
    KAMFactory factory;
    KAMRouter router;
    MockToken tokenA;
    MockToken tokenB;

    function setUp() public {
        factory = new KAMFactory();
        router = new KAMRouter(address(factory));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");
        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
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
            address(tokenA), address(tokenB), 10_000 ether, 20_000 ether, 10_000 ether, 20_000 ether, address(this)
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        require(liquidity > 0, "no liquidity");
        require(KAMPair(pair).balanceOf(address(this)) == liquidity, "lp balance");
        (uint112 r0, uint112 r1,) = KAMPair(pair).getReserves();
        require(r0 > 0 && r1 > 0, "reserves missing");
    }

    function testSwapPreservesProductWithFee() public {
        router.addLiquidity(
            address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, 10_000 ether, 10_000 ether, address(this)
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = KAMPair(pair).getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);
        uint256 bBefore = tokenB.balanceOf(address(this));

        uint256 out = router.swapExactTokensForTokens(100 ether, 1, address(tokenA), address(tokenB), address(this));
        require(out > 0, "no output");
        require(tokenB.balanceOf(address(this)) == bBefore + out, "output mismatch");

        (uint112 r0After, uint112 r1After,) = KAMPair(pair).getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);
        require(kAfter >= kBefore, "product decreased");
    }

    function testRemoveLiquidityReturnsBothAssets() public {
        (,, uint256 liquidity) = router.addLiquidity(
            address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, 10_000 ether, 10_000 ether, address(this)
        );
        address pair = factory.getPair(address(tokenA), address(tokenB));
        KAMPair(pair).approve(address(router), liquidity);
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));
        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 1, 1, address(this));
        require(amountA > 0 && amountB > 0, "no assets returned");
        require(tokenA.balanceOf(address(this)) > aBefore, "A not returned");
        require(tokenB.balanceOf(address(this)) > bBefore, "B not returned");
    }

    function testQuoteAndFeeMath() public view {
        require(router.quote(10 ether, 100 ether, 200 ether) == 20 ether, "quote");
        uint256 out = router.getAmountOut(10 ether, 100 ether, 100 ether);
        require(out > 9 ether && out < 10 ether, "fee math");
    }
}
