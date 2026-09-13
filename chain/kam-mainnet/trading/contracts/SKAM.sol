// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWKAMAsset {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Staked KAM (sKAM)
/// @notice Minimal 1:1 staking receipt token backed by WKAM locked in this contract.
/// @dev No owner, no admin mint, no tax, no blacklist, no upgradeability, and no embedded rewards.
///      Rewards, if introduced later, should be implemented as a separately audited module.
contract SKAM {
    string public constant name = "Staked KAM";
    string public constant symbol = "sKAM";
    uint8 public constant decimals = 18;

    address public immutable asset;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Staked(address indexed account, uint256 assets, uint256 shares);
    event Unstaked(address indexed account, uint256 assets, uint256 shares);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address asset_) {
        require(asset_ != address(0), "sKAM: zero asset");
        asset = asset_;
    }

    /// @notice Lock WKAM and mint the same amount of sKAM.
    function stake(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "sKAM: zero stake");
        require(IWKAMAsset(asset).transferFrom(msg.sender, address(this), amount), "sKAM: asset transfer failed");

        shares = amount;
        balanceOf[msg.sender] += shares;
        totalSupply += shares;

        emit Transfer(address(0), msg.sender, shares);
        emit Staked(msg.sender, amount, shares);
    }

    /// @notice Burn sKAM and return the same amount of WKAM.
    function unstake(uint256 shares) external returns (uint256 assets) {
        require(shares > 0, "sKAM: zero unstake");
        require(balanceOf[msg.sender] >= shares, "sKAM: insufficient balance");

        assets = shares;
        unchecked {
            balanceOf[msg.sender] -= shares;
            totalSupply -= shares;
        }

        emit Transfer(msg.sender, address(0), shares);
        emit Unstaked(msg.sender, assets, shares);

        require(IWKAMAsset(asset).transfer(msg.sender, assets), "sKAM: asset transfer failed");
    }

    function totalAssets() public view returns (uint256) {
        return IWKAMAsset(asset).balanceOf(address(this));
    }

    function isFullyBacked() external view returns (bool) {
        return totalAssets() >= totalSupply;
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
            require(allowed >= amount, "sKAM: insufficient allowance");
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "sKAM: transfer to zero");
        require(balanceOf[from] >= amount, "sKAM: insufficient balance");

        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }

        emit Transfer(from, to, amount);
    }
}
