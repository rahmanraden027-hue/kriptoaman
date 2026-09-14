// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../contracts/SKAM.sol";

interface VmSKAMFuzz {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
}

contract SKAMFuzzInvariantTest {
    VmSKAMFuzz internal constant vm = VmSKAMFuzz(address(uint160(uint256(keccak256("hevm cheat code")))));

    WKAM internal wkam;
    SKAM internal skam;

    address internal constant ALICE = address(0xA11CE);
    address internal constant BOB = address(0xB0B);
    uint256 internal constant USER_NATIVE_BALANCE = 10_000_000 ether;

    function setUp() public {
        wkam = new WKAM();
        skam = new SKAM(address(wkam));
        vm.deal(ALICE, USER_NATIVE_BALANCE);
        vm.deal(BOB, USER_NATIVE_BALANCE);
    }

    function _bound(uint256 value, uint256 minValue, uint256 maxValue) internal pure returns (uint256) {
        require(maxValue >= minValue, "bad bound");
        return minValue + (value % (maxValue - minValue + 1));
    }

    function _wrapApproveAndStake(address account, uint256 amount) internal {
        vm.prank(account);
        wkam.deposit{value: amount}();
        vm.prank(account);
        wkam.approve(address(skam), amount);
        vm.prank(account);
        skam.stake(amount);
    }

    function _assertBacking() internal view {
        require(skam.totalAssets() >= skam.totalSupply(), "sKAM backing invariant broken");
        require(wkam.balanceOf(address(skam)) == skam.totalAssets(), "asset accounting mismatch");
        require(skam.isFullyBacked(), "sKAM reports undercollateralized");
    }

    function testFuzzStakeAlwaysMintsExactlyOneToOne(uint96 seed) public {
        uint256 amount = _bound(uint256(seed), 1, 1_000_000 ether);
        _wrapApproveAndStake(ALICE, amount);

        require(skam.balanceOf(ALICE) == amount, "stake share mismatch");
        require(skam.totalSupply() == amount, "stake supply mismatch");
        require(skam.totalAssets() == amount, "stake reserve mismatch");
        _assertBacking();
    }

    function testFuzzPartialUnstakeReturnsExactlyOneToOne(uint96 stakeSeed, uint96 unstakeSeed) public {
        uint256 stakeAmount = _bound(uint256(stakeSeed), 1, 1_000_000 ether);
        uint256 unstakeAmount = _bound(uint256(unstakeSeed), 1, stakeAmount);

        _wrapApproveAndStake(ALICE, stakeAmount);

        vm.prank(ALICE);
        uint256 returned = skam.unstake(unstakeAmount);

        require(returned == unstakeAmount, "unstake asset mismatch");
        require(skam.balanceOf(ALICE) == stakeAmount - unstakeAmount, "remaining share mismatch");
        require(skam.totalSupply() == stakeAmount - unstakeAmount, "remaining supply mismatch");
        require(wkam.balanceOf(ALICE) == unstakeAmount, "WKAM return mismatch");
        _assertBacking();
    }

    function testFuzzTransfersPreserveTotalSupplyAndBacking(uint96 stakeSeed, uint96 transferSeed) public {
        uint256 stakeAmount = _bound(uint256(stakeSeed), 1, 1_000_000 ether);
        uint256 transferAmount = _bound(uint256(transferSeed), 0, stakeAmount);

        _wrapApproveAndStake(ALICE, stakeAmount);
        uint256 supplyBefore = skam.totalSupply();
        uint256 reserveBefore = skam.totalAssets();

        vm.prank(ALICE);
        skam.transfer(BOB, transferAmount);

        require(skam.balanceOf(ALICE) == stakeAmount - transferAmount, "alice share mismatch");
        require(skam.balanceOf(BOB) == transferAmount, "bob share mismatch");
        require(skam.totalSupply() == supplyBefore, "transfer changed supply");
        require(skam.totalAssets() == reserveBefore, "transfer changed reserve");
        _assertBacking();
    }

    function testFuzzTwoStakersAndTwoUnstakesPreserveBacking(
        uint96 aliceSeed,
        uint96 bobSeed,
        uint96 aliceUnstakeSeed,
        uint96 bobUnstakeSeed
    ) public {
        uint256 aliceStake = _bound(uint256(aliceSeed), 1, 500_000 ether);
        uint256 bobStake = _bound(uint256(bobSeed), 1, 500_000 ether);
        uint256 aliceUnstake = _bound(uint256(aliceUnstakeSeed), 0, aliceStake);
        uint256 bobUnstake = _bound(uint256(bobUnstakeSeed), 0, bobStake);

        _wrapApproveAndStake(ALICE, aliceStake);
        _wrapApproveAndStake(BOB, bobStake);

        if (aliceUnstake > 0) {
            vm.prank(ALICE);
            skam.unstake(aliceUnstake);
        }
        if (bobUnstake > 0) {
            vm.prank(BOB);
            skam.unstake(bobUnstake);
        }

        uint256 expectedSupply = aliceStake + bobStake - aliceUnstake - bobUnstake;
        require(skam.totalSupply() == expectedSupply, "aggregate supply mismatch");
        require(skam.totalAssets() == expectedSupply, "aggregate reserve mismatch");
        _assertBacking();
    }

    function testFuzzDirectWKAMDonationNeverMintsShares(uint96 stakeSeed, uint96 donationSeed) public {
        uint256 stakeAmount = _bound(uint256(stakeSeed), 1, 500_000 ether);
        uint256 donation = _bound(uint256(donationSeed), 1, 500_000 ether);

        _wrapApproveAndStake(ALICE, stakeAmount);

        vm.prank(BOB);
        wkam.deposit{value: donation}();
        vm.prank(BOB);
        wkam.transfer(address(skam), donation);

        require(skam.totalSupply() == stakeAmount, "donation minted shares");
        require(skam.balanceOf(BOB) == 0, "donor received shares");
        require(skam.totalAssets() == stakeAmount + donation, "donation reserve mismatch");
        _assertBacking();
    }
}
