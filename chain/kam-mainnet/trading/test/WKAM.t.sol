// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
    function expectRevert(bytes calldata) external;
}

contract WKAMTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    WKAM internal wkam;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        wkam = new WKAM();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function testMetadata() public view {
        require(keccak256(bytes(wkam.name())) == keccak256(bytes("Wrapped KAM")), "bad name");
        require(keccak256(bytes(wkam.symbol())) == keccak256(bytes("WKAM")), "bad symbol");
        require(wkam.decimals() == 18, "bad decimals");
    }

    function testDepositMintsOneToOne() public {
        vm.prank(alice);
        wkam.deposit{value: 3 ether}();
        require(wkam.balanceOf(alice) == 3 ether, "balance mismatch");
        require(wkam.totalSupply() == 3 ether, "supply mismatch");
        require(address(wkam).balance == 3 ether, "reserve mismatch");
    }

    function testReceiveMintsOneToOne() public {
        vm.prank(alice);
        (bool ok,) = address(wkam).call{value: 2 ether}("");
        require(ok, "receive failed");
        require(wkam.balanceOf(alice) == 2 ether, "receive balance mismatch");
    }

    function testWithdrawBurnsAndReturnsNative() public {
        vm.prank(alice);
        wkam.deposit{value: 5 ether}();
        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        wkam.withdraw(2 ether);
        require(wkam.balanceOf(alice) == 3 ether, "wrapped balance mismatch");
        require(wkam.totalSupply() == 3 ether, "supply mismatch");
        require(address(wkam).balance == 3 ether, "reserve mismatch");
        require(alice.balance == beforeBalance + 2 ether, "native not returned");
    }

    function testTransfer() public {
        vm.prank(alice);
        wkam.deposit{value: 4 ether}();
        vm.prank(alice);
        require(wkam.transfer(bob, 1 ether), "transfer false");
        require(wkam.balanceOf(alice) == 3 ether, "alice mismatch");
        require(wkam.balanceOf(bob) == 1 ether, "bob mismatch");
    }

    function testApproveAndTransferFrom() public {
        vm.prank(alice);
        wkam.deposit{value: 4 ether}();
        vm.prank(alice);
        require(wkam.approve(bob, 2 ether), "approve false");
        vm.prank(bob);
        require(wkam.transferFrom(alice, bob, 2 ether), "transferFrom false");
        require(wkam.balanceOf(alice) == 2 ether, "alice mismatch");
        require(wkam.balanceOf(bob) == 2 ether, "bob mismatch");
        require(wkam.allowance(alice, bob) == 0, "allowance mismatch");
    }

    function testInfiniteAllowanceNotReduced() public {
        vm.prank(alice);
        wkam.deposit{value: 3 ether}();
        vm.prank(alice);
        wkam.approve(bob, type(uint256).max);
        vm.prank(bob);
        wkam.transferFrom(alice, bob, 1 ether);
        require(wkam.allowance(alice, bob) == type(uint256).max, "infinite allowance changed");
    }

    function testCannotDepositZero() public {
        vm.prank(alice);
        vm.expectRevert(bytes("WKAM: zero deposit"));
        wkam.deposit{value: 0}();
    }

    function testCannotTransferToZero() public {
        vm.prank(alice);
        wkam.deposit{value: 1 ether}();
        vm.prank(alice);
        vm.expectRevert(bytes("WKAM: transfer to zero"));
        wkam.transfer(address(0), 1 ether);
    }

    function testReserveInvariant() public {
        vm.prank(alice);
        wkam.deposit{value: 7 ether}();
        vm.prank(bob);
        wkam.deposit{value: 3 ether}();
        vm.prank(alice);
        wkam.transfer(bob, 2 ether);
        vm.prank(bob);
        wkam.withdraw(1 ether);
        require(address(wkam).balance == wkam.totalSupply(), "WKAM not fully backed");
    }
}
