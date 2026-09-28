// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Specification interface only. No implementation or deployment authority.
interface IZUSD {
    enum RedemptionState {
        NONE,
        REQUESTED,
        SETTLED,
        BURNED,
        CANCELLED
    }

    struct ReserveState {
        uint64 epoch;
        uint64 attestedAt;
        uint64 validUntil;
        uint256 verifiedReserveUnits;
        uint256 reserveOutflowSinceAttestation;
        bytes32 attestationHash;
    }

    struct RedemptionClaim {
        address requester;
        uint256 amount;
        bytes32 destinationRefHash;
        uint64 requestedAt;
        RedemptionState state;
    }

    event ReserveAttested(
        uint64 indexed epoch,
        uint256 verifiedReserveUnits,
        bytes32 indexed attestationHash,
        uint64 validUntil
    );
    event ReserveDeficit(uint64 indexed epoch, uint256 verifiedReserveUnits, uint256 totalSupply);
    event MintedAgainstReserve(address indexed to, uint256 amount, uint64 indexed epoch);
    event RedemptionRequested(bytes32 indexed claimId, address indexed requester, uint256 amount);
    event RedemptionSettled(bytes32 indexed claimId, bytes32 settlementRefHash);
    event RedemptionBurned(bytes32 indexed claimId, uint256 amount);
    event RedemptionCancelled(bytes32 indexed claimId);

    function reserveState() external view returns (ReserveState memory);
    function effectiveReserveUnits() external view returns (uint256);
    function activeRedemptions() external view returns (uint256);
    function redemptionClaim(bytes32 claimId) external view returns (RedemptionClaim memory);

    function attestReserve(
        uint64 epoch,
        uint256 verifiedReserveUnits,
        bytes32 attestationHash,
        uint64 validUntil
    ) external;

    function mintAgainstReserve(address to, uint256 amount, uint64 epoch) external;

    function requestRedemption(
        uint256 amount,
        bytes32 destinationRefHash
    ) external returns (bytes32 claimId);

    function confirmSettlement(bytes32 claimId, bytes32 settlementRefHash) external;
    function finalizeRedemptionBurn(bytes32 claimId) external;
    function cancelRedemption(bytes32 claimId) external;
}
