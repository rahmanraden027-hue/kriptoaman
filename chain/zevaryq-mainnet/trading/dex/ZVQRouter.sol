// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZVQFactory.sol";
import "./ZVQPair.sol";
import "./interfaces/IERC20Minimal.sol";

interface IWZVQ is IERC20Minimal {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract ZVQRouter {
    address public immutable factory;
    address public immutable WZVQ;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "ZVQRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _wzvq) {
        require(_factory != address(0), "ZVQRouter: ZERO_FACTORY");
        require(_wzvq != address(0), "ZVQRouter: ZERO_WZVQ");
        factory = _factory;
        WZVQ = _wzvq;
    }

    receive() external payable {
        require(msg.sender == WZVQ, "ZVQRouter: DIRECT_ZVQ");
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "ZVQRouter: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "ZVQRouter: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "ZVQRouter: INSUFFICIENT_INPUT");
        require(reserveIn > 0 && reserveOut > 0, "ZVQRouter: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts) {
        require(path.length == 2, "ZVQRouter: SINGLE_HOP_ONLY");
        address pair = ZVQFactory(factory).getPair(path[0], path[1]);
        require(pair != address(0), "ZVQRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, path[0], path[1]);
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function _pairFor(address tokenA, address tokenB) internal returns (address pair) {
        pair = ZVQFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) pair = ZVQFactory(factory).createPair(tokenA, tokenB);
    }

    function _reservesFor(address pair, address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (uint112 reserve0, uint112 reserve1,) = ZVQPair(pair).getReserves();
        if (tokenA < tokenB) return (reserve0, reserve1);
        return (reserve1, reserve0);
    }

    function _optimalAmounts(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountA, uint256 amountB) {
        require(amountADesired >= amountAMin, "ZVQRouter: A_DESIRED_LT_MIN");
        require(amountBDesired >= amountBMin, "ZVQRouter: B_DESIRED_LT_MIN");

        if (reserveA == 0 && reserveB == 0) return (amountADesired, amountBDesired);

        uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "ZVQRouter: B_MIN");
            return (amountADesired, amountBOptimal);
        }

        uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
        require(amountAOptimal >= amountAMin, "ZVQRouter: A_MIN");
        return (amountAOptimal, amountBDesired);
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) internal returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        address pair = _pairFor(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = _reservesFor(pair, tokenA, tokenB);
        (amountA, amountB) =
            _optimalAmounts(amountADesired, amountBDesired, amountAMin, amountBMin, reserveA, reserveB);
        require(IERC20Minimal(tokenA).transferFrom(msg.sender, pair, amountA), "ZVQRouter: TRANSFER_A");
        require(IERC20Minimal(tokenB).transferFrom(msg.sender, pair, amountB), "ZVQRouter: TRANSFER_B");
        liquidity = ZVQPair(pair).mint(to);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        return _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to);
    }

    function addLiquidityZVQ(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountZVQMin,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256 amountToken, uint256 amountZVQ, uint256 liquidity) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        address pair = _pairFor(token, WZVQ);
        (uint256 reserveToken, uint256 reserveWZVQ) = _reservesFor(pair, token, WZVQ);
        (amountToken, amountZVQ) =
            _optimalAmounts(amountTokenDesired, msg.value, amountTokenMin, amountZVQMin, reserveToken, reserveWZVQ);
        require(IERC20Minimal(token).transferFrom(msg.sender, pair, amountToken), "ZVQRouter: TOKEN_TRANSFER");
        IWZVQ(WZVQ).deposit{value: amountZVQ}();
        require(IWZVQ(WZVQ).transfer(pair, amountZVQ), "ZVQRouter: WZVQ_TRANSFER");
        liquidity = ZVQPair(pair).mint(to);
        if (msg.value > amountZVQ) {
            (bool ok,) = msg.sender.call{value: msg.value - amountZVQ}("");
            require(ok, "ZVQRouter: REFUND");
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        address pair = ZVQFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "ZVQRouter: PAIR_MISSING");
        require(ZVQPair(pair).transferFrom(msg.sender, pair, liquidity), "ZVQRouter: LP_TRANSFER");
        (uint256 amount0, uint256 amount1) = ZVQPair(pair).burn(to);
        if (tokenA < tokenB) {
            (amountA, amountB) = (amount0, amount1);
        } else {
            (amountA, amountB) = (amount1, amount0);
        }
        require(amountA >= amountAMin && amountB >= amountBMin, "ZVQRouter: SLIPPAGE");
    }

    function removeLiquidityZVQ(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountZVQMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountToken, uint256 amountZVQ) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        (amountToken, amountZVQ) =
            removeLiquidity(token, WZVQ, liquidity, amountTokenMin, amountZVQMin, address(this), deadline);
        require(IERC20Minimal(token).transfer(to, amountToken), "ZVQRouter: TOKEN_OUT");
        IWZVQ(WZVQ).withdraw(amountZVQ);
        (bool ok,) = to.call{value: amountZVQ}("");
        require(ok, "ZVQRouter: ZVQ_OUT");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountOut) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        address pair = ZVQFactory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "ZVQRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, tokenOut);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "ZVQRouter: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "ZVQRouter: TRANSFER_IN");
        if (tokenIn < tokenOut) {
            ZVQPair(pair).swap(0, amountOut, to);
        } else {
            ZVQPair(pair).swap(amountOut, 0, to);
        }
    }

    function swapExactZVQForTokens(uint256 amountOutMin, address tokenOut, address to, uint256 deadline)
        external
        payable
        ensure(deadline)
        returns (uint256 amountOut)
    {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        require(msg.value > 0, "ZVQRouter: ZERO_ZVQ");
        address pair = ZVQFactory(factory).getPair(WZVQ, tokenOut);
        require(pair != address(0), "ZVQRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, WZVQ, tokenOut);
        amountOut = getAmountOut(msg.value, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "ZVQRouter: INSUFFICIENT_OUTPUT");
        IWZVQ(WZVQ).deposit{value: msg.value}();
        require(IWZVQ(WZVQ).transfer(pair, msg.value), "ZVQRouter: WZVQ_TRANSFER");
        if (WZVQ < tokenOut) {
            ZVQPair(pair).swap(0, amountOut, to);
        } else {
            ZVQPair(pair).swap(amountOut, 0, to);
        }
    }

    function swapExactTokensForZVQ(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountOut) {
        require(to != address(0), "ZVQRouter: ZERO_TO");
        address pair = ZVQFactory(factory).getPair(tokenIn, WZVQ);
        require(pair != address(0), "ZVQRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, WZVQ);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "ZVQRouter: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "ZVQRouter: TRANSFER_IN");
        if (tokenIn < WZVQ) {
            ZVQPair(pair).swap(0, amountOut, address(this));
        } else {
            ZVQPair(pair).swap(amountOut, 0, address(this));
        }
        IWZVQ(WZVQ).withdraw(amountOut);
        (bool ok,) = to.call{value: amountOut}("");
        require(ok, "ZVQRouter: ZVQ_OUT");
    }
}
