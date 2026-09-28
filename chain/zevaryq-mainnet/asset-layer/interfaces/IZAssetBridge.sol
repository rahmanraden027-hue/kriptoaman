// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Specification interface for zBTC/zETH bridge accounting.
/// @dev This interface does not prescribe a custody mechanism or claim trustlessness.
interface IZAssetBridge {
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

    event BackingAttested(
        uint64 indexed epoch,
        uint256 verifiedLockedUnits,
        bytes32 indexed attestationHash,
        uint64 validUntil
    );
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
    event SourceReleaseAttested(bytes32 indexed redemptionId, bytes32 releaseProofHash);

    function verifiedLockedUnits() external view returns (uint256);
    function depositRecord(bytes32 depositId) external view returns (DepositRecord memory);
    function redemptionRecord(bytes32 redemptionId) external view returns (RedemptionRecord memory);

    function attestBacking(
        uint64 epoch,
        uint256 verifiedLockedUnits_,
        bytes32 attestationHash,
        uint64 validUntil
    ) external;

    function computeDepositId(
        bytes32 sourceDomain,
        bytes32 sourceTxId,
        uint256 sourceIndex
    ) external view returns (bytes32 depositId);

    function attestDeposit(
        bytes32 sourceDomain,
        bytes32 sourceTxId,
        uint256 sourceIndex,
        bytes32 sourceProofHash,
        address recipient,
        uint256 amount,
        uint64 attestationEpoch
    ) external returns (bytes32 depositId);

    function mintFromDeposit(bytes32 depositId) external;

    function requestRedemption(
        uint256 amount,
        bytes32 destinationRefHash
    ) external returns (bytes32 redemptionId);

    function cancelRedemption(bytes32 redemptionId) external;
    function authorizeBurn(bytes32 redemptionId) external;
    function finalizeBurn(bytes32 redemptionId) external;
    function attestSourceRelease(bytes32 redemptionId, bytes32 releaseProofHash) external;
}
