// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KAMFactory.sol";
import "./KAMPair.sol";
import "./interfaces/IERC20Minimal.sol";

contract KAMRouter {
    address public immutable factory;

    constructor(address _factory) {
        require(_factory != address(0), "KAMRouter: ZERO_FACTORY");
        factory = _factory;
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "KAMRouter: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "KAMRouter: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "KAMRouter: INSUFFICIENT_INPUT");
        require(reserveIn > 0 && reserveOut > 0, "KAMRouter: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pair = KAMFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) pair = KAMFactory(factory).createPair(tokenA, tokenB);
        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 reserveA, uint256 reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "KAMRouter: B_MIN");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal >= amountAMin, "KAMRouter: A_MIN");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }

        require(amountA >= amountAMin && amountB >= amountBMin, "KAMRouter: SLIPPAGE");
        require(IERC20Minimal(tokenA).transferFrom(msg.sender, pair, amountA), "KAMRouter: TRANSFER_A");
        require(IERC20Minimal(tokenB).transferFrom(msg.sender, pair, amountB), "KAMRouter: TRANSFER_B");
        liquidity = KAMPair(pair).mint(to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB) {
        address pair = KAMFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        require(KAMPair(pair).transferFrom(msg.sender, pair, liquidity), "KAMRouter: LP_TRANSFER");
        (uint256 amount0, uint256 amount1) = KAMPair(pair).burn(to);
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin && amountB >= amountBMin, "KAMRouter: SLIPPAGE");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to
    ) external returns (uint256 amountOut) {
        address pair = KAMFactory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        (address token0,) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouter: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "KAMRouter: TRANSFER_IN");
        (uint256 amount0Out, uint256 amount1Out) = tokenIn == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
        KAMPair(pair).swap(amount0Out, amount1Out, to);
    }
}
