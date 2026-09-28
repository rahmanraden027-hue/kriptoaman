// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IZControlledToken {
    function controller() external view returns (address);
    function governanceSafe() external view returns (address);
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function controllerMint(address to, uint256 amount) external;
    function controllerBurnEscrow(uint256 amount) external;
}

/// @notice Shared role/timelock base for Asset Layer controllers.
/// @dev Multisig threshold enforcement is delegated to the external Safe addresses.
abstract contract ZControllerRoles {
    error WrongChain();
    error Unauthorized();
    error ZeroAddress();
    error RoleChangePending();
    error RoleChangeNotReady();
    error NoRoleChangePending();
    error TokenAlreadyInitialized();
    error InvalidTokenBinding();

    uint256 public constant ZEVARYQ_CHAIN_ID = 22028;
    uint64 public constant ROLE_CHANGE_DELAY = 1 days;

    struct PendingRoleChange {
        address nextAccount;
        uint64 eta;
    }

    address public immutable governanceSafe;
    address public token;

    mapping(bytes32 role => address account) internal _roleAccount;
    mapping(bytes32 role => PendingRoleChange pending) public pendingRoleChange;

    event TokenInitialized(address indexed token);
    event RoleChangeScheduled(bytes32 indexed role, address indexed currentAccount, address indexed nextAccount, uint64 eta);
    event RoleChangeCancelled(bytes32 indexed role, address indexed pendingAccount);
    event RoleChanged(bytes32 indexed role, address indexed previousAccount, address indexed nextAccount);

    constructor(address governanceSafe_) {
        if (block.chainid != ZEVARYQ_CHAIN_ID) revert WrongChain();
        if (governanceSafe_ == address(0)) revert ZeroAddress();
        governanceSafe = governanceSafe_;
    }

    modifier onlyGovernance() {
        if (msg.sender != governanceSafe) revert Unauthorized();
        _;
    }

    modifier onlyRole(bytes32 role) {
        if (msg.sender != _roleAccount[role]) revert Unauthorized();
        _;
    }

    modifier tokenInitialized() {
        if (token == address(0)) revert InvalidTokenBinding();
        _;
    }

    function roleAccount(bytes32 role) external view returns (address) {
        return _roleAccount[role];
    }

    function initializeToken(address token_) external onlyGovernance {
        if (token != address(0)) revert TokenAlreadyInitialized();
        if (token_ == address(0) || token_.code.length == 0) revert InvalidTokenBinding();

        IZControlledToken candidate = IZControlledToken(token_);
        if (candidate.controller() != address(this)) revert InvalidTokenBinding();
        if (candidate.governanceSafe() != governanceSafe) revert InvalidTokenBinding();

        token = token_;
        emit TokenInitialized(token_);
    }

    function scheduleRoleChange(bytes32 role, address nextAccount) external onlyGovernance {
        if (nextAccount == address(0)) revert ZeroAddress();
        if (pendingRoleChange[role].nextAccount != address(0)) revert RoleChangePending();

        uint64 eta = uint64(block.timestamp + ROLE_CHANGE_DELAY);
        pendingRoleChange[role] = PendingRoleChange({nextAccount: nextAccount, eta: eta});
        emit RoleChangeScheduled(role, _roleAccount[role], nextAccount, eta);
    }

    function cancelRoleChange(bytes32 role) external onlyGovernance {
        PendingRoleChange memory pending = pendingRoleChange[role];
        if (pending.nextAccount == address(0)) revert NoRoleChangePending();

        delete pendingRoleChange[role];
        emit RoleChangeCancelled(role, pending.nextAccount);
    }

    function executeRoleChange(bytes32 role) external onlyGovernance {
        PendingRoleChange memory pending = pendingRoleChange[role];
        if (pending.nextAccount == address(0)) revert NoRoleChangePending();
        if (block.timestamp < pending.eta) revert RoleChangeNotReady();

        address previous = _roleAccount[role];
        _roleAccount[role] = pending.nextAccount;
        delete pendingRoleChange[role];

        emit RoleChanged(role, previous, pending.nextAccount);
    }

    function _setInitialRole(bytes32 role, address account) internal {
        if (account == address(0)) revert ZeroAddress();
        _roleAccount[role] = account;
        emit RoleChanged(role, address(0), account);
    }
}
