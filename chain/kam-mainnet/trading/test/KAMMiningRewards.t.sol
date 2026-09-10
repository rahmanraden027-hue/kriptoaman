// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/KAMMiningRewards.sol";

interface VmMining {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata) external;
}

contract KAMMiningRewardsTest {
    VmMining internal constant vm = VmMining(address(uint160(uint256(keccak256("hevm cheat code")))));

    KAMMiningRewards internal mining;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        mining = new KAMMiningRewards(address(this));
        vm.deal(address(this), 1_000 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function testFundingDoesNotMintAndStakeRemainsBacked() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);

        vm.prank(alice);
        mining.stake{value: 10 ether}();

        require(mining.totalStaked() == 10 ether, "bad total stake");
        require(mining.stakedBalance(alice) == 10 ether, "bad user stake");
        require(address(mining).balance == 80 ether, "bad contract balance");
        require(mining.availableRewardBalance() == 70 ether, "reward pool mixed with principal");
    }

    function testSingleStakerEarnsFundedRewardsOverTime() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);
        vm.prank(alice);
        mining.stake{value: 10 ether}();

        vm.warp(block.timestamp + 1 days);
        uint256 earned = mining.earned(alice);

        // Integer division in rewardRate leaves only tiny dust.
        require(earned > 9.99 ether && earned <= 10 ether, "unexpected one-day reward");

        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        mining.claimReward();
        require(alice.balance > beforeBalance + 9.99 ether, "reward not paid");
        require(mining.totalRewardsPaid() > 9.99 ether, "paid counter not updated");
    }

    function testRewardsAreProRataAcrossStakers() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);

        vm.prank(alice);
        mining.stake{value: 10 ether}();
        vm.prank(bob);
        mining.stake{value: 10 ether}();

        vm.warp(block.timestamp + 1 days);
        uint256 aliceEarned = mining.earned(alice);
        uint256 bobEarned = mining.earned(bob);

        require(aliceEarned > 4.99 ether && aliceEarned <= 5 ether, "alice pro-rata mismatch");
        require(bobEarned > 4.99 ether && bobEarned <= 5 ether, "bob pro-rata mismatch");
    }

    function testPrincipalCanWithdrawWhilePaused() public {
        vm.prank(alice);
        mining.stake{value: 8 ether}();

        mining.pause();
        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        mining.withdraw(8 ether);

        require(mining.stakedBalance(alice) == 0, "stake not cleared");
        require(alice.balance == beforeBalance + 8 ether, "principal not returned");
    }

    function testPauseBlocksNewStakeAndClaims() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);
        vm.prank(alice);
        mining.stake{value: 10 ether}();
        vm.warp(block.timestamp + 1 days);
        mining.pause();

        vm.prank(bob);
        vm.expectRevert(bytes("KAMMining: paused"));
        mining.stake{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(bytes("KAMMining: paused"));
        mining.claimReward();
    }

    function testOnlyOwnerCanFundProgram() public {
        vm.prank(alice);
        vm.expectRevert(bytes("KAMMining: not owner"));
        mining.notifyRewardAmount{value: 7 ether}(7 days);
    }

    function testRewardDurationBounds() public {
        vm.expectRevert(bytes("KAMMining: duration too short"));
        mining.notifyRewardAmount{value: 7 ether}(6 days);

        vm.expectRevert(bytes("KAMMining: duration too long"));
        mining.notifyRewardAmount{value: 400 ether}(366 days);
    }

    function testActiveProgramCanBeExtendedAndPrincipalRemainsSolvent() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);

        vm.prank(alice);
        mining.stake{value: 10 ether}();

        vm.warp(block.timestamp + 1 days);
        uint256 accruedBeforeExtension = mining.earned(alice);
        require(accruedBeforeExtension > 9.99 ether, "reward did not accrue before extension");

        mining.notifyRewardAmount{value: 35 ether}(7 days);
        require(address(mining).balance >= mining.totalStaked(), "principal insolvent after extension");
        require(
            mining.availableRewardBalance() == address(mining).balance - mining.totalStaked(), "reward balance mismatch"
        );

        vm.prank(alice);
        mining.claimReward();
        require(address(mining).balance >= mining.totalStaked(), "claim consumed principal");
    }

    function testTwoStepOwnershipTransfer() public {
        mining.transferOwnership(alice);
        require(mining.owner() == address(this), "owner changed before acceptance");
        require(mining.pendingOwner() == alice, "pending owner not set");

        vm.prank(bob);
        vm.expectRevert(bytes("KAMMining: not pending owner"));
        mining.acceptOwnership();

        vm.prank(alice);
        mining.acceptOwnership();
        require(mining.owner() == alice, "ownership not transferred");
        require(mining.pendingOwner() == address(0), "pending owner not cleared");
    }

    function testExitReturnsPrincipalAndClaimableReward() public {
        mining.notifyRewardAmount{value: 70 ether}(7 days);
        vm.prank(alice);
        mining.stake{value: 10 ether}();

        vm.warp(block.timestamp + 1 days);
        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        mining.exit();

        require(mining.stakedBalance(alice) == 0, "exit left stake behind");
        require(alice.balance > beforeBalance + 19.99 ether, "exit did not return principal and reward");
        require(address(mining).balance >= mining.totalStaked(), "exit broke principal solvency");
    }

    function testAccidentalPlainTransferIsRejected() public {
        vm.prank(alice);
        (bool ok,) = address(mining).call{value: 1 ether}("");
        require(!ok, "plain native transfer should revert");
        require(address(mining).balance == 0, "reverted transfer changed balance");
    }

    receive() external payable {}
}
