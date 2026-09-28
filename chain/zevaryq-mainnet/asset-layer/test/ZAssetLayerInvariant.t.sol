// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/ZUSD.sol";
import "../contracts/ZUSDReserveController.sol";

interface VmInvariant {
    function chainId(uint256 newChainId) external;
    function warp(uint256 newTimestamp) external;
    function prank(address msgSender) external;
}

contract ZUSDInvariantHandler {
    ZUSDReserveController public immutable reserve;
    ZUSD public immutable token;
    uint256 public settlementNonce;

    constructor(ZUSDReserveController reserve_, ZUSD token_) {
        reserve = reserve_;
        token = token_;
    }

    function mintWithinBacking(uint96 seed) external {
        uint256 backing = reserve.effectiveReserveUnits();
        uint256 supply = token.totalSupply();
        if (supply >= backing) return;

        uint256 remaining = backing - supply;
        uint256 amount = (uint256(seed) % remaining) + 1;
        reserve.mintAgainstReserve(address(this), amount, reserve.reserveEpoch());
    }

    function attemptOverMint(uint96 seed) external {
        uint256 backing = reserve.effectiveReserveUnits();
        uint256 supply = token.totalSupply();
        uint256 available = backing > supply ? backing - supply : 0;
        uint256 excessive = available + (uint256(seed) % 1_000_000) + 1;

        address(reserve).call(
            abi.encodeCall(
                ZUSDReserveController.mintAgainstReserve,
                (address(this), excessive, reserve.reserveEpoch())
            )
        );
    }

    function requestAndSettle(uint96 seed) external {
        uint256 balance = token.balanceOf(address(this));
        if (balance == 0 || block.timestamp >= reserve.validUntil()) return;

        uint256 amount = (uint256(seed) % balance) + 1;
        token.approve(address(reserve), amount);

        uint256 nonce = ++settlementNonce;
        bytes32 claimId = reserve.requestRedemption(
            amount,
            keccak256(abi.encode("invariant-destination", nonce))
        );

        reserve.confirmSettlement(
            claimId,
            keccak256(abi.encode("invariant-settlement", nonce))
        );
    }
}

contract ZAssetLayerInvariantTest {
    VmInvariant internal constant vm =
        VmInvariant(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant ATTESTOR = address(0xA11CE);
    address internal constant GUARDIAN = address(0xF00D);

    ZUSDReserveController internal reserve;
    ZUSD internal zusd;
    ZUSDInvariantHandler internal handler;
    address[] internal invariantTargets;

    function setUp() public {
        vm.chainId(22028);

        reserve = new ZUSDReserveController(
            address(this),
            ATTESTOR,
            address(this),
            address(this),
            GUARDIAN
        );
        zusd = new ZUSD(address(this), address(reserve));
        reserve.initializeToken(address(zusd));

        handler = new ZUSDInvariantHandler(reserve, zusd);
        invariantTargets.push(address(handler));

        reserve.scheduleRoleChange(reserve.MINT_OPERATOR_ROLE(), address(handler));
        reserve.scheduleRoleChange(reserve.SETTLEMENT_OPERATOR_ROLE(), address(handler));
        vm.warp(block.timestamp + 1 days);
        reserve.executeRoleChange(reserve.MINT_OPERATOR_ROLE());
        reserve.executeRoleChange(reserve.SETTLEMENT_OPERATOR_ROLE());

        vm.prank(ATTESTOR);
        reserve.attestReserve(
            1,
            1_000_000_000_000,
            keccak256("invariant-reserve"),
            uint64(block.timestamp + 30 days)
        );
    }

    function targetContracts() public view returns (address[] memory) {
        return invariantTargets;
    }

    function invariant_circulatingSupplyNeverExceedsEffectiveReserve() public view {
        uint256 supply = zusd.totalSupply();
        uint256 escrow = zusd.balanceOf(address(reserve));
        uint256 circulating = supply - escrow;

        require(
            circulating <= reserve.effectiveReserveUnits(),
            "circulating supply exceeds effective reserve"
        );
    }

    function invariant_outflowNeverExceedsAttestedReserve() public view {
        require(
            reserve.reserveOutflowSinceAttestation() <= reserve.verifiedReserveUnits(),
            "reserve outflow exceeds attested reserve"
        );
    }
}
