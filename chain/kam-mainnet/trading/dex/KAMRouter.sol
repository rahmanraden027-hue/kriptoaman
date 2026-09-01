// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KAMFactory.sol";
import "./KAMPair.sol";
import "./interfaces/IERC20Minimal.sol";

interface IWKAM is IERC20Minimal {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract KAMRouter {
    address public immutable factory;
    address public immutable WKAM;
    uint256 private unlocked = 1;

    modifier nonReentrant() {
        require(unlocked == 1, "KAMRouter: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "KAMRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _wkam) {
        require(_factory != address(0), "KAMRouter: ZERO_FACTORY");
        require(_wkam != address(0), "KAMRouter: ZERO_WKAM");
        factory = _factory;
        WKAM = _wkam;
    }

    receive() external payable {
        require(msg.sender == WKAM, "KAMRouter: DIRECT_KAM");
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

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "KAMRouter: TRANSFER_FAILED");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "KAMRouter: TRANSFER_FROM_FAILED");
    }

    function _transferExactFrom(address token, address from, address to, uint256 amount) internal {
        uint256 beforeBalance = IERC20Minimal(token).balanceOf(to);
        _safeTransferFrom(token, from, to, amount);
        uint256 received = IERC20Minimal(token).balanceOf(to) - beforeBalance;
        require(received == amount, "KAMRouter: UNSUPPORTED_TOKEN");
    }

    function _pairFor(address tokenA, address tokenB) internal returns (address pair) {
        pair = KAMFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) pair = KAMFactory(factory).createPair(tokenA, tokenB);
    }

    function _reservesFor(address pair, address tokenA, address tokenB) internal view returns (uint256 reserveA, uint256 reserveB) {
        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        if (tokenA < tokenB) return (reserve0, reserve1);
        return (reserve1, reserve0);
    }

    function _optimalAmounts(uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, uint256 reserveA, uint256 reserveB)
        internal pure returns (uint256 amountA, uint256 amountB)
    {
        if (reserveA == 0 && reserveB == 0) return (amountADesired, amountBDesired);
        uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "KAMRouter: B_MIN");
            return (amountADesired, amountBOptimal);
        }
        uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
        require(amountAOptimal >= amountAMin, "KAMRouter: A_MIN");
        return (amountAOptimal, amountBDesired);
    }

    function _addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to)
        internal returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        address pair = _pairFor(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = _reservesFor(pair, tokenA, tokenB);
        (amountA, amountB) = _optimalAmounts(amountADesired, amountBDesired, amountAMin, amountBMin, reserveA, reserveB);
        _transferExactFrom(tokenA, msg.sender, pair, amountA);
        _transferExactFrom(tokenB, msg.sender, pair, amountB);
        liquidity = KAMPair(pair).mint(to);
    }

    function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        return _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to);
    }

    function addLiquidityKAM(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountKAMMin, address to, uint256 deadline)
        external payable nonReentrant ensure(deadline) returns (uint256 amountToken, uint256 amountKAM, uint256 liquidity)
    {
        address pair = _pairFor(token, WKAM);
        (uint256 reserveToken, uint256 reserveWKAM) = _reservesFor(pair, token, WKAM);
        (amountToken, amountKAM) = _optimalAmounts(amountTokenDesired, msg.value, amountTokenMin, amountKAMMin, reserveToken, reserveWKAM);
        _transferExactFrom(token, msg.sender, pair, amountToken);
        IWKAM(WKAM).deposit{value: amountKAM}();
        _safeTransfer(WKAM, pair, amountKAM);
        liquidity = KAMPair(pair).mint(to);
        if (msg.value > amountKAM) {
            (bool ok,) = msg.sender.call{value: msg.value - amountKAM}("");
            require(ok, "KAMRouter: REFUND");
        }
    }

    function _removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to)
        internal returns (uint256 amountA, uint256 amountB)
    {
        address pair = KAMFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        _safeTransferFrom(pair, msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = KAMPair(pair).burn(to);
        if (tokenA < tokenB) (amountA, amountB) = (amount0, amount1); else (amountA, amountB) = (amount1, amount0);
        require(amountA >= amountAMin && amountB >= amountBMin, "KAMRouter: SLIPPAGE");
    }

    function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB)
    {
        return _removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to);
    }

    function removeLiquidityKAM(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountKAMMin, address to, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountToken, uint256 amountKAM)
    {
        (amountToken, amountKAM) = _removeLiquidity(token, WKAM, liquidity, amountTokenMin, amountKAMMin, address(this));
        _safeTransfer(token, to, amountToken);
        IWKAM(WKAM).withdraw(amountKAM);
        (bool ok,) = to.call{value: amountKAM}("");
        require(ok, "KAMRouter: KAM_OUT");
    }

    function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut, address to, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        address pair = KAMFactory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, tokenOut);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouter: INSUFFICIENT_OUTPUT");
        _transferExactFrom(tokenIn, msg.sender, pair, amountIn);
        if (tokenIn < tokenOut) KAMPair(pair).swap(0, amountOut, to); else KAMPair(pair).swap(amountOut, 0, to);
    }

    function swapExactKAMForTokens(uint256 amountOutMin, address tokenOut, address to, uint256 deadline)
        external payable nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        require(msg.value > 0, "KAMRouter: ZERO_KAM");
        address pair = KAMFactory(factory).getPair(WKAM, tokenOut);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, WKAM, tokenOut);
        amountOut = getAmountOut(msg.value, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouter: INSUFFICIENT_OUTPUT");
        IWKAM(WKAM).deposit{value: msg.value}();
        _safeTransfer(WKAM, pair, msg.value);
        if (WKAM < tokenOut) KAMPair(pair).swap(0, amountOut, to); else KAMPair(pair).swap(amountOut, 0, to);
    }

    function swapExactTokensForKAM(uint256 amountIn, uint256 amountOutMin, address tokenIn, address to, uint256 deadline)
        external nonReentrant ensure(deadline) returns (uint256 amountOut)
    {
        address pair = KAMFactory(factory).getPair(tokenIn, WKAM);
        require(pair != address(0), "KAMRouter: PAIR_MISSING");
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, tokenIn, WKAM);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "KAMRouter: INSUFFICIENT_OUTPUT");
        _transferExactFrom(tokenIn, msg.sender, pair, amountIn);
        if (tokenIn < WKAM) KAMPair(pair).swap(0, amountOut, address(this)); else KAMPair(pair).swap(amountOut, 0, address(this));
        IWKAM(WKAM).withdraw(amountOut);
        (bool ok,) = to.call{value: amountOut}("");
        require(ok, "KAMRouter: KAM_OUT");
    }
}
