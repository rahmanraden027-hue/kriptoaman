// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IZControllerLifecycle {
    function governanceSafe() external view returns (address);
    function token() external view returns (address);
    function canRelinquishControl() external view returns (bool);
}

/// @notice Minimal immutable-accounting ERC-20 core for ZEVARYQ Asset Layer.
/// @dev No proxy, fee-on-transfer, rebase, blacklist or arbitrary owner mint.
abstract contract ZControlledERC20 {
    error WrongChain();
    error Unauthorized();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error ControllerChangePending();
    error ControllerChangeNotReady();
    error NoControllerChangePending();
    error InvalidController();
    error ControllerHasPendingOperations();

    uint256 public constant ZEVARYQ_CHAIN_ID = 22028;
    uint64 public constant CONTROLLER_CHANGE_DELAY = 1 days;

    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public totalSupply;
    mapping(address account => uint256 balance) public balanceOf;
    mapping(address owner => mapping(address spender => uint256 amount)) public allowance;

    address public immutable governanceSafe;
    address public controller;
    address public pendingController;
    uint64 public controllerEta;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event ControllerChangeScheduled(address indexed currentController, address indexed pendingController, uint64 eta);
    event ControllerChangeCancelled(address indexed pendingController);
    event ControllerChanged(address indexed previousController, address indexed newController);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address governanceSafe_,
        address initialController_
    ) {
        if (block.chainid != ZEVARYQ_CHAIN_ID) revert WrongChain();
        if (governanceSafe_ == address(0) || initialController_ == address(0)) revert ZeroAddress();
        if (initialController_.code.length == 0) revert InvalidController();

        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        governanceSafe = governanceSafe_;
        controller = initialController_;
    }

    modifier onlyGovernance() {
        if (msg.sender != governanceSafe) revert Unauthorized();
        _;
    }

    modifier onlyController() {
        if (msg.sender != controller) revert Unauthorized();
        _;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function scheduleController(address nextController) external onlyGovernance {
        if (nextController == address(0)) revert ZeroAddress();
        if (nextController.code.length == 0) revert InvalidController();
        if (pendingController != address(0)) revert ControllerChangePending();

        pendingController = nextController;
        controllerEta = uint64(block.timestamp + CONTROLLER_CHANGE_DELAY);
        emit ControllerChangeScheduled(controller, nextController, controllerEta);
    }

    function cancelControllerChange() external onlyGovernance {
        address pending = pendingController;
        if (pending == address(0)) revert NoControllerChangePending();

        pendingController = address(0);
        controllerEta = 0;
        emit ControllerChangeCancelled(pending);
    }

    function executeControllerChange() external onlyGovernance {
        address pending = pendingController;
        if (pending == address(0)) revert NoControllerChangePending();
        if (block.timestamp < controllerEta) revert ControllerChangeNotReady();
        if (!IZControllerLifecycle(controller).canRelinquishControl()) revert ControllerHasPendingOperations();

        IZControllerLifecycle candidate = IZControllerLifecycle(pending);
        if (candidate.governanceSafe() != governanceSafe || candidate.token() != address(this)) {
            revert InvalidController();
        }

        address previous = controller;
        controller = pending;
        pendingController = address(0);
        controllerEta = 0;

        emit ControllerChanged(previous, pending);
    }

    function controllerMint(address to, uint256 amount) external onlyController {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burns only tokens escrowed in the current controller itself.
    function controllerBurnEscrow(uint256 amount) external onlyController {
        if (amount == 0) revert ZeroAmount();
        uint256 balance = balanceOf[msg.sender];
        if (balance < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[msg.sender] = balance - amount;
            totalSupply -= amount;
        }
        emit Transfer(msg.sender, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();

        uint256 balance = balanceOf[from];
        if (balance < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[from] = balance - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}
