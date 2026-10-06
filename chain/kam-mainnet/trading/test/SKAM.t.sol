// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../contracts/SKAM.sol";

interface VmSKAM {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
    function expectRevert(bytes calldata) external;
}

contract SKAMTest {
    VmSKAM internal constant vm = VmSKAM(address(uint160(uint256(keccak256("hevm cheat code")))));

    WKAM internal wkam;
    SKAM internal skam;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        wkam = new WKAM();
        skam = new SKAM(address(wkam));
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function _wrapAndApprove(address account, uint256 amount) internal {
        vm.prank(account);
        wkam.deposit{value: amount}();
        vm.prank(account);
        wkam.approve(address(skam), amount);
    }

    function testMetadataAndAsset() public view {
        require(keccak256(bytes(skam.name())) == keccak256(bytes("Staked KAM")), "bad name");
        require(keccak256(bytes(skam.symbol())) == keccak256(bytes("sKAM")), "bad symbol");
        require(skam.decimals() == 18, "bad decimals");
        require(skam.asset() == address(wkam), "bad asset");
    }

    function testStakeLocksWKAMAndMintsOneToOne() public {
        _wrapAndApprove(alice, 5 ether);

        vm.prank(alice);
        uint256 shares = skam.stake(5 ether);

        require(shares == 5 ether, "share mismatch");
        require(skam.balanceOf(alice) == 5 ether, "sKAM balance mismatch");
        require(skam.totalSupply() == 5 ether, "supply mismatch");
        require(wkam.balanceOf(alice) == 0, "WKAM not locked");
        require(wkam.balanceOf(address(skam)) == 5 ether, "reserve mismatch");
        require(skam.totalAssets() == 5 ether, "asset accounting mismatch");
        require(skam.isFullyBacked(), "not fully backed");
    }

    function testUnstakeBurnsAndReturnsWKAMOneToOne() public {
        _wrapAndApprove(alice, 7 ether);
        vm.prank(alice);
        skam.stake(7 ether);

        vm.prank(alice);
        uint256 assets = skam.unstake(2 ether);

        require(assets == 2 ether, "asset mismatch");
        require(skam.balanceOf(alice) == 5 ether, "sKAM balance mismatch");
        require(skam.totalSupply() == 5 ether, "supply mismatch");
        require(wkam.balanceOf(alice) == 2 ether, "WKAM not returned");
        require(wkam.balanceOf(address(skam)) == 5 ether, "reserve mismatch");
        require(skam.isFullyBacked(), "not fully backed");
    }

    function testSKAMTransferDoesNotMoveReserve() public {
        _wrapAndApprove(alice, 4 ether);
        vm.prank(alice);
        skam.stake(4 ether);

        vm.prank(alice);
        require(skam.transfer(bob, 1 ether), "transfer false");

        require(skam.balanceOf(alice) == 3 ether, "alice mismatch");
        require(skam.balanceOf(bob) == 1 ether, "bob mismatch");
        require(wkam.balanceOf(address(skam)) == 4 ether, "reserve moved");
        require(skam.isFullyBacked(), "not fully backed");
    }

    function testApproveAndTransferFrom() public {
        _wrapAndApprove(alice, 3 ether);
        vm.prank(alice);
        skam.stake(3 ether);

        vm.prank(alice);
        skam.approve(bob, 2 ether);
        vm.prank(bob);
        require(skam.transferFrom(alice, bob, 2 ether), "transferFrom false");

        require(skam.balanceOf(alice) == 1 ether, "alice mismatch");
        require(skam.balanceOf(bob) == 2 ether, "bob mismatch");
        require(skam.allowance(alice, bob) == 0, "allowance mismatch");
    }

    function testCannotStakeZero() public {
        vm.prank(alice);
        vm.expectRevert(bytes("sKAM: zero stake"));
        skam.stake(0);
    }

    function testCannotUnstakeMoreThanBalance() public {
        vm.prank(alice);
        vm.expectRevert(bytes("sKAM: insufficient balance"));
        skam.unstake(1 ether);
    }

    function testCannotTransferToZero() public {
        _wrapAndApprove(alice, 1 ether);
        vm.prank(alice);
        skam.stake(1 ether);

        vm.prank(alice);
        vm.expectRevert(bytes("sKAM: transfer to zero"));
        skam.transfer(address(0), 1 ether);
    }

    function testBackingInvariantAcrossTwoStakersAndUnstake() public {
        _wrapAndApprove(alice, 7 ether);
        _wrapAndApprove(bob, 3 ether);

        vm.prank(alice);
        skam.stake(7 ether);
        vm.prank(bob);
        skam.stake(3 ether);

        vm.prank(alice);
        skam.transfer(bob, 2 ether);
        vm.prank(bob);
        skam.unstake(1 ether);

        require(skam.totalSupply() == 9 ether, "unexpected supply");
        require(wkam.balanceOf(address(skam)) == 9 ether, "reserve mismatch");
        require(skam.totalAssets() >= skam.totalSupply(), "backing invariant broken");
    }

    function testDirectWKAMDonationCannotCreateUnbackedSKAM() public {
        _wrapAndApprove(alice, 2 ether);
        vm.prank(alice);
        skam.stake(1 ether);

        vm.prank(alice);
        wkam.transfer(address(skam), 1 ether);

        require(skam.totalSupply() == 1 ether, "donation minted shares");
        require(skam.totalAssets() == 2 ether, "donation not reflected");
        require(skam.isFullyBacked(), "donation broke backing");
    }
}
