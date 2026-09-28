// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./common/ZControllerRoles.sol";

contract ZUSDReserveController is ZControllerRoles {
    error InvalidAmount();
    error InvalidEpoch();
    error InvalidAttestation();
    error AttestationExpired();
    error AttestationReplay();
    error BackingExceeded();
    error OperationPaused();
    error InvalidPauseWindow();
    error InvalidClaim();
    error InvalidClaimState();

    bytes32 public constant RESERVE_ATTESTOR_ROLE = keccak256("ZUSD_RESERVE_ATTESTOR");
    bytes32 public constant MINT_OPERATOR_ROLE = keccak256("ZUSD_MINT_OPERATOR");
    bytes32 public constant SETTLEMENT_OPERATOR_ROLE = keccak256("ZUSD_SETTLEMENT_OPERATOR");
    bytes32 public constant EMERGENCY_GUARDIAN_ROLE = keccak256("ZUSD_EMERGENCY_GUARDIAN");

    uint64 public constant MAX_EMERGENCY_PAUSE = 1 days;

    enum RedemptionState {
        NONE,
        REQUESTED,
        SETTLED,
        BURNED,
        CANCELLED
    }

    struct RedemptionClaim {
        address requester;
        uint256 amount;
        bytes32 destinationRefHash;
        uint64 requestedAt;
        RedemptionState state;
    }

    uint64 public reserveEpoch;
    uint64 public attestedAt;
    uint64 public validUntil;
    uint256 public verifiedReserveUnits;
    bytes32 public attestationHash;

    uint64 public mintPausedUntil;
    uint64 public redemptionPausedUntil;
    uint256 public redemptionNonce;

    mapping(bytes32 hash => bool used) public usedReserveAttestation;
    mapping(bytes32 claimId => RedemptionClaim claim) public redemptionClaim;
    mapping(bytes32 claimId => bytes32 settlementRefHash) public settlementReference;

    event ReserveAttested(
        uint64 indexed epoch, uint256 verifiedReserveUnits, bytes32 indexed attestationHash, uint64 validUntil
    );
    event ReserveDeficit(uint64 indexed epoch, uint256 verifiedReserveUnits, uint256 totalSupply);
    event MintedAgainstReserve(address indexed to, uint256 amount, uint64 indexed epoch);
    event RedemptionRequested(bytes32 indexed claimId, address indexed requester, uint256 amount);
    event RedemptionSettled(bytes32 indexed claimId, bytes32 settlementRefHash);
    event RedemptionBurned(bytes32 indexed claimId, uint256 amount);
    event RedemptionCancelled(bytes32 indexed claimId);
    event MintPauseSet(uint64 until);
    event RedemptionPauseSet(uint64 until);

    constructor(
        address governanceSafe_,
        address reserveAttestor_,
        address mintOperator_,
        address settlementOperator_,
        address emergencyGuardian_
    ) ZControllerRoles(governanceSafe_) {
        _setInitialRole(RESERVE_ATTESTOR_ROLE, reserveAttestor_);
        _setInitialRole(MINT_OPERATOR_ROLE, mintOperator_);
        _setInitialRole(SETTLEMENT_OPERATOR_ROLE, settlementOperator_);
        _setInitialRole(EMERGENCY_GUARDIAN_ROLE, emergencyGuardian_);
    }

    function mintPaused() public view returns (bool) {
        return block.timestamp < mintPausedUntil;
    }

    function redemptionPaused() public view returns (bool) {
        return block.timestamp < redemptionPausedUntil;
    }

    function attestReserve(uint64 epoch, uint256 reserveUnits, bytes32 evidenceHash, uint64 expiresAt)
        external
        onlyRole(RESERVE_ATTESTOR_ROLE)
        tokenInitialized
    {
        if (epoch <= reserveEpoch) revert InvalidEpoch();
        if (evidenceHash == bytes32(0) || expiresAt <= block.timestamp) revert InvalidAttestation();
        if (usedReserveAttestation[evidenceHash]) revert AttestationReplay();

        usedReserveAttestation[evidenceHash] = true;
        reserveEpoch = epoch;
        verifiedReserveUnits = reserveUnits;
        attestationHash = evidenceHash;
        attestedAt = uint64(block.timestamp);
        validUntil = expiresAt;

        uint256 supply = IZControlledToken(token).totalSupply();
        if (reserveUnits < supply) {
            emit ReserveDeficit(epoch, reserveUnits, supply);
        }
        emit ReserveAttested(epoch, reserveUnits, evidenceHash, expiresAt);
    }

    function mintAgainstReserve(address to, uint256 amount, uint64 epoch)
        external
        onlyRole(MINT_OPERATOR_ROLE)
        tokenInitialized
    {
        if (mintPaused()) revert OperationPaused();
        if (amount == 0 || to == address(0)) revert InvalidAmount();
        if (epoch != reserveEpoch || block.timestamp > validUntil) revert AttestationExpired();

        IZControlledToken controlledToken = IZControlledToken(token);
        if (controlledToken.totalSupply() + amount > verifiedReserveUnits) revert BackingExceeded();

        controlledToken.controllerMint(to, amount);
        emit MintedAgainstReserve(to, amount, epoch);
    }

    function requestRedemption(uint256 amount, bytes32 destinationRefHash)
        external
        tokenInitialized
        returns (bytes32 claimId)
    {
        if (redemptionPaused()) revert OperationPaused();
        if (amount == 0 || destinationRefHash == bytes32(0)) revert InvalidAmount();

        uint256 nonce = ++redemptionNonce;
        claimId = keccak256(
            abi.encode(
                "ZEVARYQ_ZUSD_REDEMPTION_V1",
                block.chainid,
                address(this),
                msg.sender,
                nonce,
                amount,
                destinationRefHash
            )
        );

        RedemptionClaim storage claim = redemptionClaim[claimId];
        if (claim.state != RedemptionState.NONE) revert InvalidClaim();

        claim.requester = msg.sender;
        claim.amount = amount;
        claim.destinationRefHash = destinationRefHash;
        claim.requestedAt = uint64(block.timestamp);
        claim.state = RedemptionState.REQUESTED;

        if (!IZControlledToken(token).transferFrom(msg.sender, address(this), amount)) revert InvalidClaim();
        emit RedemptionRequested(claimId, msg.sender, amount);
    }

    function confirmSettlement(bytes32 claimId, bytes32 settlementRefHash) external onlyRole(SETTLEMENT_OPERATOR_ROLE) {
        if (settlementRefHash == bytes32(0)) revert InvalidClaim();
        RedemptionClaim storage claim = redemptionClaim[claimId];
        if (claim.state != RedemptionState.REQUESTED) revert InvalidClaimState();

        claim.state = RedemptionState.SETTLED;
        settlementReference[claimId] = settlementRefHash;
        emit RedemptionSettled(claimId, settlementRefHash);
    }

    function finalizeRedemptionBurn(bytes32 claimId) external tokenInitialized {
        RedemptionClaim storage claim = redemptionClaim[claimId];
        if (claim.state != RedemptionState.SETTLED) revert InvalidClaimState();

        claim.state = RedemptionState.BURNED;
        IZControlledToken(token).controllerBurnEscrow(claim.amount);
        emit RedemptionBurned(claimId, claim.amount);
    }

    function cancelRedemption(bytes32 claimId) external tokenInitialized {
        RedemptionClaim storage claim = redemptionClaim[claimId];
        if (claim.state != RedemptionState.REQUESTED || claim.requester != msg.sender) revert InvalidClaimState();

        claim.state = RedemptionState.CANCELLED;
        if (!IZControlledToken(token).transfer(msg.sender, claim.amount)) revert InvalidClaim();
        emit RedemptionCancelled(claimId);
    }

    function pauseMint(uint64 until) external onlyRole(EMERGENCY_GUARDIAN_ROLE) {
        _validatePause(until);
        mintPausedUntil = until;
        emit MintPauseSet(until);
    }

    function pauseRedemption(uint64 until) external onlyRole(EMERGENCY_GUARDIAN_ROLE) {
        _validatePause(until);
        redemptionPausedUntil = until;
        emit RedemptionPauseSet(until);
    }

    function clearMintPause() external onlyGovernance {
        mintPausedUntil = 0;
        emit MintPauseSet(0);
    }

    function clearRedemptionPause() external onlyGovernance {
        redemptionPausedUntil = 0;
        emit RedemptionPauseSet(0);
    }

    function _validatePause(uint64 until) internal view {
        if (until <= block.timestamp || until > block.timestamp + MAX_EMERGENCY_PAUSE) {
            revert InvalidPauseWindow();
        }
    }
}
