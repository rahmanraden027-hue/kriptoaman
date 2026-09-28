// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Wrapped ZEVARYQ
/// @notice Minimal 1:1 wrapper for native ZVQ on ZEVARYQ Mainnet.
/// @dev No owner, no admin mint, no tax, no blacklist, no upgradeability.
contract WZVQ {
    string public constant name = "Wrapped ZEVARYQ";
    string public constant symbol = "WZVQ";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        require(msg.value > 0, "WZVQ: zero deposit");
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "WZVQ: insufficient balance");

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "WZVQ: native transfer failed");

        emit Withdrawal(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "WZVQ: insufficient allowance");
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "WZVQ: transfer to zero");
        require(balanceOf[from] >= amount, "WZVQ: insufficient balance");

        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }

        emit Transfer(from, to, amount);
    }
}
