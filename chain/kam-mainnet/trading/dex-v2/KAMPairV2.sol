// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/interfaces/IERC20Minimal.sol";

contract KAMPairV2 {
    string public constant name = "KAM LP Token V2";
    string public constant symbol = "KAM-LP-V2";
    uint8 public constant decimals = 18;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    address public immutable factory;
    address public token0;
    address public token1;
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    bool public initialSeeded;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 private unlocked = 1;

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event PreseedRecovered(address indexed recipient, uint256 amount0, uint256 amount1);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    modifier lock() {
        require(unlocked == 1, "KAMPairV2: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor() {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(msg.sender == factory, "KAMPairV2: FORBIDDEN");
        require(token0 == address(0) && token1 == address(0), "KAMPairV2: INITIALIZED");
        require(_token0 != _token1 && _token0 != address(0), "KAMPairV2: BAD_TOKENS");
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "KAMPairV2: ALLOWANCE");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    /// @notice Factory-only atomic first seed. Counterfactual pre-funding is recovered
    /// to the provider before exact official seed balances are verified and LP is minted.
    function seed(
        address to,
        address recoveryRecipient,
        uint256 preBalance0,
        uint256 preBalance1,
        uint256 expected0,
        uint256 expected1
    ) external lock returns (uint256 liquidity) {
        require(msg.sender == factory, "KAMPairV2: FORBIDDEN");
        require(!initialSeeded && totalSupply == 0, "KAMPairV2: ALREADY_SEEDED");
        require(to != address(0) && recoveryRecipient != address(0), "KAMPairV2: ZERO_TO");
        require(expected0 > 0 && expected1 > 0, "KAMPairV2: ZERO_AMOUNT");

        if (preBalance0 > 0) _safeTransfer(token0, recoveryRecipient, preBalance0);
        if (preBalance1 > 0) _safeTransfer(token1, recoveryRecipient, preBalance1);
        if (preBalance0 > 0 || preBalance1 > 0) {
            emit PreseedRecovered(recoveryRecipient, preBalance0, preBalance1);
        }

        uint256 balance0 = IERC20Minimal(token0).balanceOf(address(this));
        uint256 balance1 = IERC20Minimal(token1).balanceOf(address(this));
        require(balance0 == expected0, "KAMPairV2: NON_STANDARD_0");
        require(balance1 == expected1, "KAMPairV2: NON_STANDARD_1");

        uint256 root = _sqrt(balance0 * balance1);
        require(root > MINIMUM_LIQUIDITY, "KAMPairV2: INSUFFICIENT_LIQUIDITY");
        liquidity = root - MINIMUM_LIQUIDITY;
        _mint(address(0), MINIMUM_LIQUIDITY);
        _mint(to, liquidity);
        initialSeeded = true;
        _update(balance0, balance1);
        emit Mint(msg.sender, balance0, balance1);
    }

    function mint(address to) external lock returns (uint256 liquidity) {
        require(initialSeeded, "KAMPairV2: NOT_SEEDED");
        (uint112 _reserve0, uint112 _reserve1,) = this.getReserves();
        uint256 balance0 = IERC20Minimal(token0).balanceOf(address(this));
        uint256 balance1 = IERC20Minimal(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        liquidity = _min((amount0 * totalSupply) / _reserve0, (amount1 * totalSupply) / _reserve1);
        require(liquidity > 0, "KAMPairV2: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);
        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(address to) external lock returns (uint256 amount0, uint256 amount1) {
        uint256 liquidity = balanceOf[address(this)];
        uint256 balance0 = IERC20Minimal(token0).balanceOf(address(this));
        uint256 balance1 = IERC20Minimal(token1).balanceOf(address(this));
        uint256 supply = totalSupply;
        amount0 = (liquidity * balance0) / supply;
        amount1 = (liquidity * balance1) / supply;
        require(amount0 > 0 && amount1 > 0, "KAMPairV2: INSUFFICIENT_LIQUIDITY_BURNED");
        _burn(address(this), liquidity);
        _safeTransfer(token0, to, amount0);
        _safeTransfer(token1, to, amount1);
        balance0 = IERC20Minimal(token0).balanceOf(address(this));
        balance1 = IERC20Minimal(token1).balanceOf(address(this));
        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(uint256 amount0Out, uint256 amount1Out, address to) external lock {
        require(amount0Out > 0 || amount1Out > 0, "KAMPairV2: INSUFFICIENT_OUTPUT");
        (uint112 _reserve0, uint112 _reserve1,) = this.getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "KAMPairV2: INSUFFICIENT_LIQUIDITY");
        require(to != token0 && to != token1, "KAMPairV2: INVALID_TO");

        if (amount0Out > 0) _safeTransfer(token0, to, amount0Out);
        if (amount1Out > 0) _safeTransfer(token1, to, amount1Out);

        uint256 balance0 = IERC20Minimal(token0).balanceOf(address(this));
        uint256 balance1 = IERC20Minimal(token1).balanceOf(address(this));
        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "KAMPairV2: INSUFFICIENT_INPUT");

        uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
        uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
        require(
            balance0Adjusted * balance1Adjusted >= uint256(_reserve0) * uint256(_reserve1) * 1_000_000,
            "KAMPairV2: K"
        );

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function _update(uint256 balance0, uint256 balance1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "KAMPairV2: OVERFLOW");
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);
        emit Sync(reserve0, reserve1);
    }

    function _mint(address to, uint256 value) private {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) private {
        require(balanceOf[from] >= value, "KAMPairV2: BALANCE");
        balanceOf[from] -= value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
    }

    function _transfer(address from, address to, uint256 value) private {
        require(to != address(0), "KAMPairV2: ZERO_TO");
        require(balanceOf[from] >= value, "KAMPairV2: BALANCE");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _safeTransfer(address token, address to, uint256 value) private {
        require(IERC20Minimal(token).transfer(to, value), "KAMPairV2: TRANSFER_FAILED");
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x < y ? x : y;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
