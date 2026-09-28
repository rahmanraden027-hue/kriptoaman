// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/ZUSD.sol";
import "../contracts/zBTC.sol";
import "../contracts/zETH.sol";
import "../contracts/ZUSDReserveController.sol";
import "../contracts/ZAssetBridgeController.sol";

interface VmAssetLayer {
    function chainId(uint256 newChainId) external;
    function warp(uint256 newTimestamp) external;
    function prank(address msgSender) external;
}

contract ZAssetLayerTest {
    VmAssetLayer internal constant vm =
        VmAssetLayer(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant RESERVE_ATTESTOR = address(0xA11CE);
    address internal constant MINT_OPERATOR = address(0xB0B);
    address internal constant SETTLEMENT_OPERATOR = address(0xCAFE);
    address internal constant BRIDGE_ATTESTOR = address(0xBEEF);
    address internal constant RELEASE_OPERATOR = address(0xD00D);
    address internal constant GUARDIAN = address(0xF00D);
    address internal constant USER = address(0x1234);
    address internal constant USER2 = address(0x5678);

    bytes32 internal constant BTC_DOMAIN = keccak256("bitcoin-mainnet");
    bytes32 internal constant ETH_DOMAIN = keccak256("eip155:1");

    ZUSDReserveController internal reserve;
    ZUSD internal zusd;

    ZAssetBridgeController internal btcBridge;
    zBTC internal zbtc;

    ZAssetBridgeController internal ethBridge;
    zETH internal zeth;

    function setUp() public {
        vm.chainId(22028);

        reserve = new ZUSDReserveController(
            address(this),
            RESERVE_ATTESTOR,
            MINT_OPERATOR,
            SETTLEMENT_OPERATOR,
            GUARDIAN
        );
        zusd = new ZUSD(address(this), address(reserve));
        reserve.initializeToken(address(zusd));

        btcBridge = new ZAssetBridgeController(
            keccak256("zBTC"),
            address(this),
            BRIDGE_ATTESTOR,
            RELEASE_OPERATOR,
            GUARDIAN
        );
        zbtc = new zBTC(address(this), address(btcBridge));
        btcBridge.initializeToken(address(zbtc));

        ethBridge = new ZAssetBridgeController(
            keccak256("zETH"),
            address(this),
            BRIDGE_ATTESTOR,
            RELEASE_OPERATOR,
            GUARDIAN
        );
        zeth = new zETH(address(this), address(ethBridge));
        ethBridge.initializeToken(address(zeth));
    }

    function testMetadataAndInitialSupply() public view {
        require(keccak256(bytes(zusd.name())) == keccak256("ZEVARYQ USD"), "ZUSD name");
        require(keccak256(bytes(zusd.symbol())) == keccak256("ZUSD"), "ZUSD symbol");
        require(zusd.decimals() == 6, "ZUSD decimals");
        require(zusd.totalSupply() == 0, "ZUSD premine");

        require(keccak256(bytes(zbtc.symbol())) == keccak256("zBTC"), "zBTC symbol");
        require(zbtc.decimals() == 8, "zBTC decimals");
        require(zbtc.totalSupply() == 0, "zBTC premine");

        require(keccak256(bytes(zeth.symbol())) == keccak256("zETH"), "zETH symbol");
        require(zeth.decimals() == 18, "zETH decimals");
        require(zeth.totalSupply() == 0, "zETH premine");
    }

    function testZUSDMintCannotExceedVerifiedReserve() public {
        _attestReserve(1, 1_000_000_000, keccak256("reserve-1"), uint64(block.timestamp + 1 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 600_000_000, 1);
        require(zusd.totalSupply() == 600_000_000, "supply after mint");

        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, 400_000_001, 1))
        );
        require(!ok, "unbacked ZUSD mint accepted");
        require(zusd.totalSupply() <= reserve.verifiedReserveUnits(), "reserve invariant");
    }

    function testZUSDDeficitAttestationDisablesFurtherMintWithoutConfiscation() public {
        _attestReserve(1, 100_000_000, keccak256("reserve-before-deficit"), uint64(block.timestamp + 2 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 100_000_000, 1);

        _attestReserve(2, 50_000_000, keccak256("reserve-deficit"), uint64(block.timestamp + 2 days));

        require(zusd.totalSupply() == 100_000_000, "deficit confiscated user supply");
        require(reserve.verifiedReserveUnits() == 50_000_000, "deficit not recorded");

        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, 1, uint64(2)))
        );
        require(!ok, "mint continued during reserve deficit");
    }

    function testZUSDExpiredAttestationCannotMint() public {
        uint64 expiry = uint64(block.timestamp + 10);
        _attestReserve(1, 1_000_000, keccak256("reserve-expiry"), expiry);
        vm.warp(expiry + 1);

        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, 1, 1))
        );
        require(!ok, "expired attestation minted");
    }

    function testZUSDReserveAttestationCannotReplay() public {
        bytes32 evidence = keccak256("same-evidence");
        _attestReserve(1, 1_000_000, evidence, uint64(block.timestamp + 1 days));

        vm.prank(RESERVE_ATTESTOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(
                ZUSDReserveController.attestReserve,
                (uint64(2), uint256(2_000_000), evidence, uint64(block.timestamp + 1 days))
            )
        );
        require(!ok, "reserve evidence replayed");
    }

    function testZUSDRedemptionEscrowSettlementAndBurn() public {
        _attestReserve(1, 100_000_000, keccak256("reserve-redeem"), uint64(block.timestamp + 1 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 100_000_000, 1);

        vm.prank(USER);
        zusd.approve(address(reserve), 40_000_000);

        vm.prank(USER);
        bytes32 claimId = reserve.requestRedemption(40_000_000, keccak256("bank-ref"));

        require(zusd.balanceOf(address(reserve)) == 40_000_000, "escrow missing");
        require(zusd.totalSupply() == 100_000_000, "burned before settlement");

        vm.prank(SETTLEMENT_OPERATOR);
        reserve.confirmSettlement(claimId, keccak256("settlement"));

        reserve.finalizeRedemptionBurn(claimId);

        require(zusd.balanceOf(address(reserve)) == 0, "escrow remains");
        require(zusd.balanceOf(USER) == 60_000_000, "user balance");
        require(zusd.totalSupply() == 60_000_000, "burn accounting");
    }

    function testZUSDRedemptionCanCancelBeforeSettlement() public {
        _attestReserve(1, 10_000_000, keccak256("reserve-cancel"), uint64(block.timestamp + 1 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 10_000_000, 1);

        vm.prank(USER);
        zusd.approve(address(reserve), 4_000_000);

        vm.prank(USER);
        bytes32 claimId = reserve.requestRedemption(4_000_000, keccak256("cancel-dest"));

        vm.prank(USER);
        reserve.cancelRedemption(claimId);

        require(zusd.balanceOf(USER) == 10_000_000, "cancel did not refund");
        require(zusd.totalSupply() == 10_000_000, "cancel changed supply");
    }

    function testEmergencyMintPauseIsScopedAndTimeBounded() public {
        _attestReserve(1, 10_000_000, keccak256("reserve-pause"), uint64(block.timestamp + 2 days));

        uint64 pauseUntil = uint64(block.timestamp + 1 hours);
        vm.prank(GUARDIAN);
        reserve.pauseMint(pauseUntil);

        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, 1_000_000, 1))
        );
        require(!ok, "mint bypassed pause");

        vm.warp(pauseUntil + 1);
        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 1_000_000, 1);

        require(zusd.balanceOf(USER) == 1_000_000, "mint did not resume");
    }

    function testBridgeDepositIsCanonicalAndSingleUse() public {
        _attestBTCBacking(1, 5e8, keccak256("btc-backing"), uint64(block.timestamp + 1 days));

        bytes32 txid = keccak256("btc-tx-1");
        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            txid,
            0,
            keccak256("btc-proof-1"),
            USER,
            2e8,
            1
        );

        require(depositId == btcBridge.computeDepositId(BTC_DOMAIN, txid, 0), "deposit id mismatch");

        btcBridge.mintFromDeposit(depositId);
        require(zbtc.balanceOf(USER) == 2e8, "bridge mint missing");
        require(zbtc.totalSupply() <= btcBridge.verifiedLockedUnits(), "BTC backing invariant");

        vm.prank(BRIDGE_ATTESTOR);
        (bool ok,) = address(btcBridge).call(
            abi.encodeCall(
                ZAssetBridgeController.attestDeposit,
                (BTC_DOMAIN, txid, uint256(0), keccak256("alternate-proof"), USER, uint256(2e8), uint64(1))
            )
        );
        require(!ok, "same BTC source event minted twice");
    }

    function testBridgeMintCannotExceedVerifiedBacking() public {
        _attestBTCBacking(1, 1e8, keccak256("btc-small-backing"), uint64(block.timestamp + 1 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-too-large"),
            1,
            keccak256("btc-proof-large"),
            USER,
            2e8,
            1
        );

        (bool ok,) = address(btcBridge).call(
            abi.encodeCall(ZAssetBridgeController.mintFromDeposit, (depositId))
        );
        require(!ok, "bridge minted above backing");
        require(zbtc.totalSupply() == 0, "unbacked zBTC supply");
    }

    function testBridgeRedemptionBurnsBeforeReleaseAttestation() public {
        _attestBTCBacking(1, 5e8, keccak256("btc-redeem-backing"), uint64(block.timestamp + 1 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-redeem-deposit"),
            0,
            keccak256("btc-redeem-proof"),
            USER,
            2e8,
            1
        );
        btcBridge.mintFromDeposit(depositId);

        vm.prank(USER);
        zbtc.approve(address(btcBridge), 1e8);

        vm.prank(USER);
        bytes32 redemptionId = btcBridge.requestRedemption(1e8, keccak256("btc-destination"));

        vm.prank(RELEASE_OPERATOR);
        btcBridge.authorizeBurn(redemptionId);

        btcBridge.finalizeBurn(redemptionId);
        require(zbtc.totalSupply() == 1e8, "bridge burn failed");

        vm.prank(RELEASE_OPERATOR);
        btcBridge.attestSourceRelease(redemptionId, keccak256("btc-release-proof"));

        require(btcBridge.releaseReference(redemptionId) != bytes32(0), "release proof missing");
    }

    function testBridgeRedemptionCanCancelBeforeBurnAuthorization() public {
        _attestBTCBacking(1, 2e8, keccak256("btc-cancel-backing"), uint64(block.timestamp + 1 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-cancel-deposit"),
            0,
            keccak256("btc-cancel-proof"),
            USER,
            1e8,
            1
        );
        btcBridge.mintFromDeposit(depositId);

        vm.prank(USER);
        zbtc.approve(address(btcBridge), 1e8);

        vm.prank(USER);
        bytes32 redemptionId = btcBridge.requestRedemption(1e8, keccak256("btc-cancel-dest"));

        vm.prank(USER);
        btcBridge.cancelRedemption(redemptionId);

        require(zbtc.balanceOf(USER) == 1e8, "bridge cancel refund");
        require(zbtc.totalSupply() == 1e8, "bridge cancel supply");
    }

    function testControllerChangeRequiresTimelock() public {
        address nextController = address(0x9999);
        zusd.scheduleController(nextController);

        (bool early,) = address(zusd).call(abi.encodeWithSignature("executeControllerChange()"));
        require(!early, "controller changed before delay");

        vm.warp(block.timestamp + 1 days);
        zusd.executeControllerChange();
        require(zusd.controller() == nextController, "controller did not change");
    }

    function testUnauthorizedDirectTokenMintFails() public {
        (bool ok,) = address(zusd).call(
            abi.encodeWithSignature("controllerMint(address,uint256)", USER, uint256(1_000_000))
        );
        require(!ok, "direct mint accepted");
    }

    function testFuzzZUSDSupplyNeverExceedsBacking(uint96 reserveRaw, uint96 mintRaw) public {
        uint256 reserveUnits = (uint256(reserveRaw) % 1e24) + 1;
        uint256 amount = (uint256(mintRaw) % reserveUnits) + 1;

        _attestReserve(1, reserveUnits, keccak256(abi.encode("fuzz-reserve", reserveUnits)), uint64(block.timestamp + 1 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, amount, 1);
        require(zusd.totalSupply() <= reserveUnits, "fuzz reserve invariant");

        uint256 excessive = reserveUnits - amount + 1;
        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, excessive, uint64(1)))
        );
        require(!ok, "fuzz overmint accepted");
    }

    function testFuzzBridgeSupplyNeverExceedsBacking(uint96 backingRaw, uint96 depositRaw) public {
        uint256 backing = (uint256(backingRaw) % 1e24) + 1;
        uint256 amount = (uint256(depositRaw) % backing) + 1;

        _attestBTCBacking(1, backing, keccak256(abi.encode("fuzz-btc", backing)), uint64(block.timestamp + 1 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256(abi.encode("fuzz-tx", depositRaw)),
            0,
            keccak256(abi.encode("fuzz-proof", depositRaw)),
            USER,
            amount,
            1
        );

        btcBridge.mintFromDeposit(depositId);
        require(zbtc.totalSupply() <= btcBridge.verifiedLockedUnits(), "fuzz bridge invariant");
    }

    function testETHDepositDomainSeparation() public {
        vm.prank(BRIDGE_ATTESTOR);
        ethBridge.attestBacking(1, 10 ether, keccak256("eth-backing"), uint64(block.timestamp + 1 days));

        bytes32 txid = keccak256("eth-tx");
        bytes32 ethId = ethBridge.computeDepositId(ETH_DOMAIN, txid, 7);
        bytes32 btcId = btcBridge.computeDepositId(ETH_DOMAIN, txid, 7);
        require(ethId != btcId, "controller domain collision");
    }

    function testZUSDSettledReserveOutflowCannotBeRemintedBeforeFreshBacking() public {
        _attestReserve(1, 100_000_000, keccak256("reserve-outflow"), uint64(block.timestamp + 2 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 100_000_000, 1);

        vm.prank(USER);
        zusd.approve(address(reserve), 40_000_000);

        vm.prank(USER);
        bytes32 claimId = reserve.requestRedemption(40_000_000, keccak256("outflow-destination"));

        vm.prank(SETTLEMENT_OPERATOR);
        reserve.confirmSettlement(claimId, keccak256("outflow-settlement"));

        require(reserve.effectiveReserveUnits() == 60_000_000, "reserve outflow not deducted");

        reserve.finalizeRedemptionBurn(claimId);
        require(zusd.totalSupply() == 60_000_000, "redemption burn mismatch");

        vm.prank(MINT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (USER, uint256(1), uint64(1)))
        );
        require(!ok, "stale reserve capacity reused");

        _attestReserve(2, 100_000_000, keccak256("fresh-reserve-after-outflow"), uint64(block.timestamp + 2 days));
        require(reserve.effectiveReserveUnits() == 100_000_000, "fresh reserve did not reset outflow");

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 40_000_000, 2);
        require(zusd.totalSupply() == 100_000_000, "fresh reserve did not restore capacity");
    }

    function testZUSDSettlementReferenceCannotReplayAcrossClaims() public {
        _attestReserve(1, 100_000_000, keccak256("reserve-settlement-replay"), uint64(block.timestamp + 2 days));

        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 100_000_000, 1);

        vm.prank(USER);
        zusd.approve(address(reserve), 40_000_000);

        vm.prank(USER);
        bytes32 claim1 = reserve.requestRedemption(20_000_000, keccak256("dest-1"));

        vm.prank(USER);
        bytes32 claim2 = reserve.requestRedemption(20_000_000, keccak256("dest-2"));

        bytes32 settlementRef = keccak256("single-bank-settlement");
        vm.prank(SETTLEMENT_OPERATOR);
        reserve.confirmSettlement(claim1, settlementRef);

        vm.prank(SETTLEMENT_OPERATOR);
        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.confirmSettlement, (claim2, settlementRef))
        );
        require(!ok, "settlement evidence replayed");
    }

    function testBridgeReleaseCannotRestoreStaleMintCapacity() public {
        _attestBTCBacking(1, 5e8, keccak256("btc-outflow-backing"), uint64(block.timestamp + 2 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-five"),
            0,
            keccak256("btc-five-proof"),
            USER,
            5e8,
            1
        );
        btcBridge.mintFromDeposit(depositId);

        vm.prank(USER);
        zbtc.approve(address(btcBridge), 2e8);

        vm.prank(USER);
        bytes32 redemptionId = btcBridge.requestRedemption(2e8, keccak256("btc-release-destination"));

        vm.prank(RELEASE_OPERATOR);
        btcBridge.authorizeBurn(redemptionId);
        btcBridge.finalizeBurn(redemptionId);

        require(btcBridge.pendingReleaseUnits() == 2e8, "pending release missing");
        require(btcBridge.effectiveLockedUnits() == 3e8, "pending release did not reserve backing");

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 pendingDeposit = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-new-before-refresh"),
            0,
            keccak256("btc-new-before-refresh-proof"),
            USER2,
            1e8,
            1
        );

        (bool beforeRelease,) = address(btcBridge).call(
            abi.encodeCall(ZAssetBridgeController.mintFromDeposit, (pendingDeposit))
        );
        require(!beforeRelease, "mint reused backing reserved for release");

        vm.prank(RELEASE_OPERATOR);
        btcBridge.attestSourceRelease(redemptionId, keccak256("btc-source-release"));
        require(btcBridge.effectiveLockedUnits() == 3e8, "released backing was reused");

        (bool afterRelease,) = address(btcBridge).call(
            abi.encodeCall(ZAssetBridgeController.mintFromDeposit, (pendingDeposit))
        );
        require(!afterRelease, "mint reused released backing");

        _attestBTCBacking(2, 4e8, keccak256("btc-refreshed-backing"), uint64(block.timestamp + 2 days));

        vm.prank(BRIDGE_ATTESTOR);
        btcBridge.refreshDepositAttestation(pendingDeposit, keccak256("btc-refreshed-deposit-proof"), 2);

        btcBridge.mintFromDeposit(pendingDeposit);
        require(zbtc.totalSupply() == 4e8, "fresh bridge backing did not restore capacity");
    }

    function testBridgeReleaseProofCannotReplay() public {
        _attestBTCBacking(1, 4e8, keccak256("btc-release-replay-backing"), uint64(block.timestamp + 2 days));

        vm.prank(BRIDGE_ATTESTOR);
        bytes32 depositId = btcBridge.attestDeposit(
            BTC_DOMAIN,
            keccak256("btc-release-replay-deposit"),
            0,
            keccak256("btc-release-replay-proof"),
            USER,
            4e8,
            1
        );
        btcBridge.mintFromDeposit(depositId);

        vm.prank(USER);
        zbtc.approve(address(btcBridge), 2e8);

        vm.prank(USER);
        bytes32 redemption1 = btcBridge.requestRedemption(1e8, keccak256("btc-destination-1"));

        vm.prank(USER);
        bytes32 redemption2 = btcBridge.requestRedemption(1e8, keccak256("btc-destination-2"));

        vm.prank(RELEASE_OPERATOR);
        btcBridge.authorizeBurn(redemption1);
        btcBridge.finalizeBurn(redemption1);

        vm.prank(RELEASE_OPERATOR);
        btcBridge.authorizeBurn(redemption2);
        btcBridge.finalizeBurn(redemption2);

        bytes32 releaseProof = keccak256("one-release-proof");
        vm.prank(RELEASE_OPERATOR);
        btcBridge.attestSourceRelease(redemption1, releaseProof);

        vm.prank(RELEASE_OPERATOR);
        (bool ok,) = address(btcBridge).call(
            abi.encodeCall(ZAssetBridgeController.attestSourceRelease, (redemption2, releaseProof))
        );
        require(!ok, "release proof replayed");
    }

    function testControllerMigrationRejectsEOA() public {
        (bool ok,) = address(zusd).call(
            abi.encodeWithSignature("scheduleController(address)", address(0x9999))
        );
        require(!ok, "EOA accepted as controller");
    }

    function testControllerMigrationWaitsForOutstandingRedemption() public {
        ZUSDReserveController nextReserve = new ZUSDReserveController(
            address(this),
            RESERVE_ATTESTOR,
            MINT_OPERATOR,
            SETTLEMENT_OPERATOR,
            GUARDIAN
        );

        zusd.scheduleController(address(nextReserve));
        nextReserve.initializeToken(address(zusd));

        _attestReserve(1, 10_000_000, keccak256("migration-reserve"), uint64(block.timestamp + 2 days));
        vm.prank(MINT_OPERATOR);
        reserve.mintAgainstReserve(USER, 10_000_000, 1);

        vm.prank(USER);
        zusd.approve(address(reserve), 1_000_000);

        vm.prank(USER);
        bytes32 claimId = reserve.requestRedemption(1_000_000, keccak256("migration-destination"));

        vm.warp(block.timestamp + 1 days);

        (bool blocked,) = address(zusd).call(abi.encodeWithSignature("executeControllerChange()"));
        require(!blocked, "controller migrated with active redemption");

        vm.prank(USER);
        reserve.cancelRedemption(claimId);

        zusd.executeControllerChange();
        require(zusd.controller() == address(nextReserve), "controller migration failed after quiescence");
    }

    function testZeroValueERC20TransferRemainsCompatible() public {
        vm.prank(USER);
        bool ok = zusd.transfer(USER2, 0);
        require(ok, "zero transfer rejected");
        require(zusd.balanceOf(USER) == 0 && zusd.balanceOf(USER2) == 0, "zero transfer changed balances");
    }

    function _attestReserve(uint64 epoch, uint256 units, bytes32 evidence, uint64 expiry) internal {
        vm.prank(RESERVE_ATTESTOR);
        reserve.attestReserve(epoch, units, evidence, expiry);
    }

    function _attestBTCBacking(uint64 epoch, uint256 units, bytes32 evidence, uint64 expiry) internal {
        vm.prank(BRIDGE_ATTESTOR);
        btcBridge.attestBacking(epoch, units, evidence, expiry);
    }
}
