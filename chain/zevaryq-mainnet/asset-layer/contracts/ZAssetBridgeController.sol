// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./common/ZControllerRoles.sol";

contract ZAssetBridgeController is ZControllerRoles {
    error InvalidAmount();
    error InvalidEpoch();
    error InvalidAttestation();
    error AttestationExpired();
    error AttestationReplay();
    error BackingExceeded();
    error OperationPaused();
    error InvalidPauseWindow();
    error InvalidDeposit();
    error InvalidDepositState();
    error InvalidRedemption();
    error InvalidRedemptionState();

    bytes32 public constant BRIDGE_ATTESTOR_ROLE = keccak256("ZASSET_BRIDGE_ATTESTOR");
    bytes32 public constant RELEASE_OPERATOR_ROLE = keccak256("ZASSET_RELEASE_OPERATOR");
    bytes32 public constant EMERGENCY_GUARDIAN_ROLE = keccak256("ZASSET_EMERGENCY_GUARDIAN");

    uint64 public constant MAX_EMERGENCY_PAUSE = 1 days;

    enum DepositState {
        UNSEEN,
        ATTESTED,
        MINTED
    }

    enum RedemptionState {
        NONE,
        REQUESTED,
        BURN_AUTHORIZED,
        BURNED,
        RELEASE_ATTESTED,
        CANCELLED
    }

    struct DepositRecord {
        bytes32 sourceProofHash;
        address recipient;
        uint256 amount;
        uint64 attestationEpoch;
        DepositState state;
    }

    struct RedemptionRecord {
        address requester;
        uint256 amount;
        bytes32 destinationRefHash;
        uint64 requestedAt;
        RedemptionState state;
    }

    bytes32 public immutable assetId;

    uint64 public backingEpoch;
    uint64 public backingAttestedAt;
    uint64 public backingValidUntil;
    uint256 public verifiedLockedUnits;
    bytes32 public backingAttestationHash;
    uint64 public bridgeOpsPausedUntil;
    uint256 public redemptionNonce;

    mapping(bytes32 hash => bool used) public usedBackingAttestation;
    mapping(bytes32 depositId => DepositRecord record) public depositRecord;
    mapping(bytes32 redemptionId => RedemptionRecord record) public redemptionRecord;
    mapping(bytes32 redemptionId => bytes32 releaseProofHash) public releaseReference;

    event BackingAttested(
        uint64 indexed epoch, uint256 verifiedLockedUnits, bytes32 indexed attestationHash, uint64 validUntil
    );
    event BackingDeficit(uint64 indexed epoch, uint256 verifiedLockedUnits, uint256 totalSupply);
    event DepositAttested(
        bytes32 indexed depositId,
        address indexed recipient,
        uint256 amount,
        bytes32 sourceProofHash,
        uint64 attestationEpoch
    );
    event BridgeMinted(bytes32 indexed depositId, address indexed recipient, uint256 amount);
    event RedemptionRequested(bytes32 indexed redemptionId, address indexed requester, uint256 amount);
    event RedemptionBurnAuthorized(bytes32 indexed redemptionId);
    event RedemptionBurned(bytes32 indexed redemptionId, uint256 amount);
    event RedemptionCancelled(bytes32 indexed redemptionId);
    event SourceReleaseAttested(bytes32 indexed redemptionId, bytes32 releaseProofHash);
    event BridgePauseSet(uint64 until);

    constructor(
        bytes32 assetId_,
        address governanceSafe_,
        address bridgeAttestor_,
        address releaseOperator_,
        address emergencyGuardian_
    ) ZControllerRoles(governanceSafe_) {
        if (assetId_ == bytes32(0)) revert InvalidAttestation();
        assetId = assetId_;

        _setInitialRole(BRIDGE_ATTESTOR_ROLE, bridgeAttestor_);
        _setInitialRole(RELEASE_OPERATOR_ROLE, releaseOperator_);
        _setInitialRole(EMERGENCY_GUARDIAN_ROLE, emergencyGuardian_);
    }

    function bridgeOpsPaused() public view returns (bool) {
        return block.timestamp < bridgeOpsPausedUntil;
    }

    function computeDepositId(bytes32 sourceDomain, bytes32 sourceTxId, uint256 sourceIndex)
        public
        view
        returns (bytes32)
    {
        if (sourceDomain == bytes32(0) || sourceTxId == bytes32(0)) revert InvalidDeposit();

        return keccak256(
            abi.encode(
                "ZEVARYQ_BRIDGE_DEPOSIT_V1",
                block.chainid,
                address(this),
                assetId,
                sourceDomain,
                sourceTxId,
                sourceIndex
            )
        );
    }

    function attestBacking(uint64 epoch, uint256 lockedUnits, bytes32 evidenceHash, uint64 expiresAt)
        external
        onlyRole(BRIDGE_ATTESTOR_ROLE)
        tokenInitialized
    {
        if (epoch <= backingEpoch) revert InvalidEpoch();
        if (evidenceHash == bytes32(0) || expiresAt <= block.timestamp) revert InvalidAttestation();
        if (usedBackingAttestation[evidenceHash]) revert AttestationReplay();

        usedBackingAttestation[evidenceHash] = true;
        backingEpoch = epoch;
        verifiedLockedUnits = lockedUnits;
        backingAttestationHash = evidenceHash;
        backingAttestedAt = uint64(block.timestamp);
        backingValidUntil = expiresAt;

        uint256 supply = IZControlledToken(token).totalSupply();
        if (lockedUnits < supply) {
            emit BackingDeficit(epoch, lockedUnits, supply);
        }
        emit BackingAttested(epoch, lockedUnits, evidenceHash, expiresAt);
    }

    function attestDeposit(
        bytes32 sourceDomain,
        bytes32 sourceTxId,
        uint256 sourceIndex,
        bytes32 sourceProofHash,
        address recipient,
        uint256 amount,
        uint64 attestationEpoch
    ) external onlyRole(BRIDGE_ATTESTOR_ROLE) tokenInitialized returns (bytes32 depositId) {
        if (bridgeOpsPaused()) revert OperationPaused();
        if (recipient == address(0) || amount == 0 || sourceProofHash == bytes32(0)) revert InvalidDeposit();
        if (attestationEpoch != backingEpoch || block.timestamp > backingValidUntil) revert AttestationExpired();

        depositId = computeDepositId(sourceDomain, sourceTxId, sourceIndex);
        DepositRecord storage record = depositRecord[depositId];
        if (record.state != DepositState.UNSEEN) revert InvalidDepositState();

        record.sourceProofHash = sourceProofHash;
        record.recipient = recipient;
        record.amount = amount;
        record.attestationEpoch = attestationEpoch;
        record.state = DepositState.ATTESTED;

        emit DepositAttested(depositId, recipient, amount, sourceProofHash, attestationEpoch);
    }

    function mintFromDeposit(bytes32 depositId) external tokenInitialized {
        if (bridgeOpsPaused()) revert OperationPaused();
        if (block.timestamp > backingValidUntil) revert AttestationExpired();

        DepositRecord storage record = depositRecord[depositId];
        if (record.state != DepositState.ATTESTED) revert InvalidDepositState();

        IZControlledToken controlledToken = IZControlledToken(token);
        if (controlledToken.totalSupply() + record.amount > verifiedLockedUnits) revert BackingExceeded();

        record.state = DepositState.MINTED;
        controlledToken.controllerMint(record.recipient, record.amount);
        emit BridgeMinted(depositId, record.recipient, record.amount);
    }

    function requestRedemption(uint256 amount, bytes32 destinationRefHash)
        external
        tokenInitialized
        returns (bytes32 redemptionId)
    {
        if (bridgeOpsPaused()) revert OperationPaused();
        if (amount == 0 || destinationRefHash == bytes32(0)) revert InvalidRedemption();

        uint256 nonce = ++redemptionNonce;
        redemptionId = keccak256(
            abi.encode(
                "ZEVARYQ_BRIDGE_REDEMPTION_V1",
                block.chainid,
                address(this),
                assetId,
                msg.sender,
                nonce,
                amount,
                destinationRefHash
            )
        );

        RedemptionRecord storage record = redemptionRecord[redemptionId];
        if (record.state != RedemptionState.NONE) revert InvalidRedemptionState();

        record.requester = msg.sender;
        record.amount = amount;
        record.destinationRefHash = destinationRefHash;
        record.requestedAt = uint64(block.timestamp);
        record.state = RedemptionState.REQUESTED;

        if (!IZControlledToken(token).transferFrom(msg.sender, address(this), amount)) {
            revert InvalidRedemption();
        }

        emit RedemptionRequested(redemptionId, msg.sender, amount);
    }

    function cancelRedemption(bytes32 redemptionId) external tokenInitialized {
        RedemptionRecord storage record = redemptionRecord[redemptionId];
        if (record.state != RedemptionState.REQUESTED || record.requester != msg.sender) {
            revert InvalidRedemptionState();
        }

        record.state = RedemptionState.CANCELLED;
        if (!IZControlledToken(token).transfer(msg.sender, record.amount)) revert InvalidRedemption();
        emit RedemptionCancelled(redemptionId);
    }

    function authorizeBurn(bytes32 redemptionId) external onlyRole(RELEASE_OPERATOR_ROLE) {
        RedemptionRecord storage record = redemptionRecord[redemptionId];
        if (record.state != RedemptionState.REQUESTED) revert InvalidRedemptionState();

        record.state = RedemptionState.BURN_AUTHORIZED;
        emit RedemptionBurnAuthorized(redemptionId);
    }

    function finalizeBurn(bytes32 redemptionId) external tokenInitialized {
        RedemptionRecord storage record = redemptionRecord[redemptionId];
        if (record.state != RedemptionState.BURN_AUTHORIZED) revert InvalidRedemptionState();

        record.state = RedemptionState.BURNED;
        IZControlledToken(token).controllerBurnEscrow(record.amount);
        emit RedemptionBurned(redemptionId, record.amount);
    }

    function attestSourceRelease(bytes32 redemptionId, bytes32 releaseProofHash)
        external
        onlyRole(RELEASE_OPERATOR_ROLE)
    {
        if (releaseProofHash == bytes32(0)) revert InvalidRedemption();
        RedemptionRecord storage record = redemptionRecord[redemptionId];
        if (record.state != RedemptionState.BURNED) revert InvalidRedemptionState();

        record.state = RedemptionState.RELEASE_ATTESTED;
        releaseReference[redemptionId] = releaseProofHash;
        emit SourceReleaseAttested(redemptionId, releaseProofHash);
    }

    function pauseBridgeOps(uint64 until) external onlyRole(EMERGENCY_GUARDIAN_ROLE) {
        if (until <= block.timestamp || until > block.timestamp + MAX_EMERGENCY_PAUSE) {
            revert InvalidPauseWindow();
        }
        bridgeOpsPausedUntil = until;
        emit BridgePauseSet(until);
    }

    function clearBridgePause() external onlyGovernance {
        bridgeOpsPausedUntil = 0;
        emit BridgePauseSet(0);
    }
}
