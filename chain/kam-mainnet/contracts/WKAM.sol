// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Wrapped KAM (WKAM)
/// @notice Minimal wrapped-native-token contract for KriptoAman Mainnet.
/// @dev 1 WKAM is backed 1:1 by native KAM held by this contract.
contract WKAM {
    string public constant name = "Wrapped KAM";
    string public constant symbol = "WKAM";
    uint8 public constant decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Deposit(address indexed account, uint256 value);
    event Withdrawal(address indexed account, uint256 value);

    receive() external payable {
        deposit();
    }

    function totalSupply() external view returns (uint256) {
        return address(this).balance;
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function withdraw(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "WKAM: insufficient balance");

        unchecked {
            balanceOf[msg.sender] -= value;
        }

        emit Withdrawal(msg.sender, value);
        emit Transfer(msg.sender, address(0), value);

        (bool ok, ) = payable(msg.sender).call{value: value}("");
        require(ok, "WKAM: native transfer failed");
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
            require(allowed >= value, "WKAM: insufficient allowance");
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "WKAM: transfer to zero address");
        require(balanceOf[from] >= value, "WKAM: insufficient balance");

        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
        }

        emit Transfer(from, to, value);
    }
}
