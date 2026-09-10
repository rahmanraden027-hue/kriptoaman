// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KAM Mining Rewards
/// @notice Native-KAM staking rewards contract for the KAM Network mining pilot.
/// @dev This is not Proof-of-Work mining and it does not mint new KAM. Rewards must be
///      funded up front by the owner and are distributed to users pro rata by stake/time.
contract KAMMiningRewards {
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_REWARD_DURATION = 7 days;
    uint256 public constant MAX_REWARD_DURATION = 365 days;

    address public owner;
    address public pendingOwner;
    bool public paused;
    uint256 private unlocked = 1;

    uint256 public totalStaked;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public totalRewardsPaid;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event RewardProgramFunded(uint256 amount, uint256 duration, uint256 rewardRate, uint256 periodFinish);
    event Staked(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event RewardPaid(address indexed account, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "KAMMining: not owner");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "KAMMining: reentrant call");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    modifier whenNotPaused() {
        require(!paused, "KAMMining: paused");
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "KAMMining: zero owner");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    receive() external payable {
        revert("KAMMining: use stake or notifyRewardAmount");
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        uint256 elapsed = lastTimeRewardApplicable() - lastUpdateTime;
        return rewardPerTokenStored + ((elapsed * rewardRate * PRECISION) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        uint256 delta = rewardPerToken() - userRewardPerTokenPaid[account];
        return ((stakedBalance[account] * delta) / PRECISION) + rewards[account];
    }

    function availableRewardBalance() public view returns (uint256) {
        uint256 balance = address(this).balance;
        return balance > totalStaked ? balance - totalStaked : 0;
    }

    function stake() external payable nonReentrant whenNotPaused updateReward(msg.sender) {
        require(msg.value > 0, "KAMMining: zero stake");
        totalStaked += msg.value;
        stakedBalance[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    /// @notice Withdraw principal. Intentionally remains available while paused.
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "KAMMining: zero withdraw");
        require(amount <= stakedBalance[msg.sender], "KAMMining: insufficient stake");

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "KAMMining: withdraw transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "KAMMining: no reward");
        require(reward <= availableRewardBalance(), "KAMMining: reward pool insufficient");

        rewards[msg.sender] = 0;
        totalRewardsPaid += reward;
        (bool success,) = payable(msg.sender).call{value: reward}("");
        require(success, "KAMMining: reward transfer failed");
        emit RewardPaid(msg.sender, reward);
    }

    function exit() external {
        uint256 balance = stakedBalance[msg.sender];
        if (balance > 0) withdraw(balance);
        if (!paused && earned(msg.sender) > 0) claimReward();
    }

    /// @notice Fund or extend a reward program. Rewards are native KAM supplied up front.
    function notifyRewardAmount(uint256 duration)
        external
        payable
        onlyOwner
        nonReentrant
        updateReward(address(0))
    {
        require(!paused, "KAMMining: paused");
        require(msg.value > 0, "KAMMining: zero reward funding");
        require(duration >= MIN_REWARD_DURATION, "KAMMining: duration too short");
        require(duration <= MAX_REWARD_DURATION, "KAMMining: duration too long");

        uint256 newRewardRate;
        if (block.timestamp >= periodFinish) {
            newRewardRate = msg.value / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            newRewardRate = (msg.value + leftover) / duration;
        }

        require(newRewardRate > 0, "KAMMining: reward rate zero");
        require(newRewardRate * duration <= availableRewardBalance(), "KAMMining: reward funding mismatch");

        rewardRate = newRewardRate;
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + duration;

        emit RewardProgramFunded(msg.value, duration, newRewardRate, periodFinish);
    }

    function pause() external onlyOwner {
        require(!paused, "KAMMining: already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        require(paused, "KAMMining: not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "KAMMining: zero pending owner");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "KAMMining: not pending owner");
        address previousOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, owner);
    }
}
