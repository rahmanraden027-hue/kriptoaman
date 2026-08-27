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

    function _pairFor(address tokenA, address tokenB) internal returns (address pair) {
        pair = KAMFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = KAMFactory(factory).createPair(tokenA, tokenB);
        }
    }

    function _reservesFor(address pair, address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        if (tokenA < tokenB) {
            reserveA = reserve0;
            reserveB = reserve1;
        } else {
            reserveA = reserve1;
            reserveB = reserve0;
        }
    }

    function _optimalAmounts(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountA, uint256 amountB) {
        if (reserveA == 0 && reserveB == 0) {
            return (amountADesired, amountBDesired);
        }

        uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "KAMRouter: B_MIN");
            return (amountADesired, amountBOptimal);
        }

        uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
        require(amountAOptimal >= amountAMin, "KAMRouter: A_MIN");
        return (amountAOptimal, amountBDesired);
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
        address pair = _pairFor(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = _reservesFor(pair, tokenA, tokenB);

        (amountA, amountB) = _optimalAmounts(
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            reserveA,
            reserveB
        );

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
        if (tokenA < tokenB) {
            amountA = amount0;
            amountB = amount1;
        } else {
            amountA = amount1;
            amountB = amount0;
        }
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
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, tokenOut);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouter: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "KAMRouter: TRANSFER_IN");

        if (tokenIn < tokenOut) {
            KAMPair(pair).swap(0, amountOut, to);
        } else {
            KAMPair(pair).swap(amountOut, 0, to);
        }
    }
}
