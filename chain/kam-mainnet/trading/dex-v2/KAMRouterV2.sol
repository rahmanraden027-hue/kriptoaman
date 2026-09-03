// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KAMFactoryV2.sol";
import "./KAMPairV2.sol";
import "../dex/interfaces/IERC20Minimal.sol";

interface IWKAMV2 is IERC20Minimal {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/// @notice Pre-audit router candidate.
/// Key differences from deployed V1:
/// - never auto-creates pairs;
/// - enforces transaction deadlines;
/// - enforces both min amounts on every liquidity branch;
/// - adds a router-level reentrancy guard for state-changing entry points.
contract KAMRouterV2 {
    address public immutable factory;
    address public immutable WKAM;
    uint256 private unlocked = 1;

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "KAMRouterV2: EXPIRED");
        _;
    }

    modifier lock() {
        require(unlocked == 1, "KAMRouterV2: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor(address _factory, address _wkam) {
        require(_factory != address(0), "KAMRouterV2: ZERO_FACTORY");
        require(_wkam != address(0), "KAMRouterV2: ZERO_WKAM");
        factory = _factory;
        WKAM = _wkam;
    }

    receive() external payable {
        require(msg.sender == WKAM, "KAMRouterV2: DIRECT_KAM");
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "KAMRouterV2: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "KAMRouterV2: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "KAMRouterV2: INSUFFICIENT_INPUT");
        require(reserveIn > 0 && reserveOut > 0, "KAMRouterV2: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function _pairFor(address tokenA, address tokenB) internal view returns (address pair) {
        pair = KAMFactoryV2(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "KAMRouterV2: PAIR_MISSING");
    }

    function _reservesFor(address pair, address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (uint112 reserve0, uint112 reserve1,) = KAMPairV2(pair).getReserves();
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
        if (reserveA == 0 && reserveB == 0) {
            require(amountADesired >= amountAMin, "KAMRouterV2: A_MIN");
            require(amountBDesired >= amountBMin, "KAMRouterV2: B_MIN");
            return (amountADesired, amountBDesired);
        }

        uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            require(amountADesired >= amountAMin, "KAMRouterV2: A_MIN");
            require(amountBOptimal >= amountBMin, "KAMRouterV2: B_MIN");
            return (amountADesired, amountBOptimal);
        }

        uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
        require(amountAOptimal >= amountAMin, "KAMRouterV2: A_MIN");
        require(amountBDesired >= amountBMin, "KAMRouterV2: B_MIN");
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
        address pair = _pairFor(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = _reservesFor(pair, tokenA, tokenB);
        (amountA, amountB) =
            _optimalAmounts(amountADesired, amountBDesired, amountAMin, amountBMin, reserveA, reserveB);
        require(IERC20Minimal(tokenA).transferFrom(msg.sender, pair, amountA), "KAMRouterV2: TRANSFER_A");
        require(IERC20Minimal(tokenB).transferFrom(msg.sender, pair, amountB), "KAMRouterV2: TRANSFER_B");
        liquidity = KAMPairV2(pair).mint(to);
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
    ) external lock ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        return _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to);
    }

    function addLiquidityKAM(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountKAMMin,
        address to,
        uint256 deadline
    ) external payable lock ensure(deadline) returns (uint256 amountToken, uint256 amountKAM, uint256 liquidity) {
        address pair = _pairFor(token, WKAM);
        (uint256 reserveToken, uint256 reserveWKAM) = _reservesFor(pair, token, WKAM);
        (amountToken, amountKAM) = _optimalAmounts(
            amountTokenDesired, msg.value, amountTokenMin, amountKAMMin, reserveToken, reserveWKAM
        );
        require(IERC20Minimal(token).transferFrom(msg.sender, pair, amountToken), "KAMRouterV2: TOKEN_TRANSFER");
        IWKAMV2(WKAM).deposit{value: amountKAM}();
        require(IWKAMV2(WKAM).transfer(pair, amountKAM), "KAMRouterV2: WKAM_TRANSFER");
        liquidity = KAMPairV2(pair).mint(to);
        if (msg.value > amountKAM) {
            (bool ok,) = msg.sender.call{value: msg.value - amountKAM}("");
            require(ok, "KAMRouterV2: REFUND");
        }
    }

    function _removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) internal returns (uint256 amountA, uint256 amountB) {
        address pair = _pairFor(tokenA, tokenB);
        require(KAMPairV2(pair).transferFrom(msg.sender, pair, liquidity), "KAMRouterV2: LP_TRANSFER");
        (uint256 amount0, uint256 amount1) = KAMPairV2(pair).burn(to);
        if (tokenA < tokenB) {
            (amountA, amountB) = (amount0, amount1);
        } else {
            (amountA, amountB) = (amount1, amount0);
        }
        require(amountA >= amountAMin && amountB >= amountBMin, "KAMRouterV2: SLIPPAGE");
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external lock ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        return _removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to);
    }

    function removeLiquidityKAM(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountKAMMin,
        address to,
        uint256 deadline
    ) external lock ensure(deadline) returns (uint256 amountToken, uint256 amountKAM) {
        (amountToken, amountKAM) =
            _removeLiquidity(token, WKAM, liquidity, amountTokenMin, amountKAMMin, address(this));
        require(IERC20Minimal(token).transfer(to, amountToken), "KAMRouterV2: TOKEN_OUT");
        IWKAMV2(WKAM).withdraw(amountKAM);
        (bool ok,) = to.call{value: amountKAM}("");
        require(ok, "KAMRouterV2: KAM_OUT");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to,
        uint256 deadline
    ) external lock ensure(deadline) returns (uint256 amountOut) {
        address pair = _pairFor(tokenIn, tokenOut);
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, tokenOut);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouterV2: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "KAMRouterV2: TRANSFER_IN");
        if (tokenIn < tokenOut) {
            KAMPairV2(pair).swap(0, amountOut, to);
        } else {
            KAMPairV2(pair).swap(amountOut, 0, to);
        }
    }

    function swapExactKAMForTokens(uint256 amountOutMin, address tokenOut, address to, uint256 deadline)
        external
        payable
        lock
        ensure(deadline)
        returns (uint256 amountOut)
    {
        require(msg.value > 0, "KAMRouterV2: ZERO_KAM");
        address pair = _pairFor(WKAM, tokenOut);
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, WKAM, tokenOut);
        amountOut = getAmountOut(msg.value, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouterV2: INSUFFICIENT_OUTPUT");
        IWKAMV2(WKAM).deposit{value: msg.value}();
        require(IWKAMV2(WKAM).transfer(pair, msg.value), "KAMRouterV2: WKAM_TRANSFER");
        if (WKAM < tokenOut) {
            KAMPairV2(pair).swap(0, amountOut, to);
        } else {
            KAMPairV2(pair).swap(amountOut, 0, to);
        }
    }

    function swapExactTokensForKAM(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address to,
        uint256 deadline
    ) external lock ensure(deadline) returns (uint256 amountOut) {
        address pair = _pairFor(tokenIn, WKAM);
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, WKAM);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouterV2: INSUFFICIENT_OUTPUT");
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, pair, amountIn), "KAMRouterV2: TRANSFER_IN");
        if (tokenIn < WKAM) {
            KAMPairV2(pair).swap(0, amountOut, address(this));
        } else {
            KAMPairV2(pair).swap(amountOut, 0, address(this));
        }
        IWKAMV2(WKAM).withdraw(amountOut);
        (bool ok,) = to.call{value: amountOut}("");
        require(ok, "KAMRouterV2: KAM_OUT");
    }
}
