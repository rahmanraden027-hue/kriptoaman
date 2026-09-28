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

    constructor(ZUSDReserveController reserve_, ZUSD token_) {
        reserve = reserve_;
        token = token_;
    }

    function mintWithinBacking(uint96 seed) external {
        uint256 backing = reserve.verifiedReserveUnits();
        uint256 supply = token.totalSupply();
        if (supply >= backing) return;

        uint256 remaining = backing - supply;
        uint256 amount = (uint256(seed) % remaining) + 1;
        reserve.mintAgainstReserve(address(this), amount, reserve.reserveEpoch());
    }

    function attemptOverMint(uint96 seed) external {
        uint256 backing = reserve.verifiedReserveUnits();
        uint256 supply = token.totalSupply();
        uint256 excessive = (backing - supply) + (uint256(seed) % 1_000_000) + 1;

        address(reserve)
            .call(
                abi.encodeCall(
                    ZUSDReserveController.mintAgainstReserve, (address(this), excessive, reserve.reserveEpoch())
                )
            );
    }
}

contract ZAssetLayerInvariantTest {
    VmInvariant internal constant vm = VmInvariant(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant ATTESTOR = address(0xA11CE);
    address internal constant SETTLER = address(0xCAFE);
    address internal constant GUARDIAN = address(0xF00D);

    ZUSDReserveController internal reserve;
    ZUSD internal zusd;
    ZUSDInvariantHandler internal handler;
    address[] internal invariantTargets;

    function setUp() public {
        vm.chainId(22028);

        reserve = new ZUSDReserveController(address(this), ATTESTOR, address(this), SETTLER, GUARDIAN);
        zusd = new ZUSD(address(this), address(reserve));
        reserve.initializeToken(address(zusd));

        handler = new ZUSDInvariantHandler(reserve, zusd);
        invariantTargets.push(address(handler));

        reserve.scheduleRoleChange(reserve.MINT_OPERATOR_ROLE(), address(handler));
        vm.warp(block.timestamp + 1 days);
        reserve.executeRoleChange(reserve.MINT_OPERATOR_ROLE());

        vm.prank(ATTESTOR);
        reserve.attestReserve(1, 1_000_000_000_000, keccak256("invariant-reserve"), uint64(block.timestamp + 30 days));

    }

    function targetContracts() public view returns (address[] memory) {
        return invariantTargets;
    }

    function invariant_supplyNeverExceedsVerifiedReserveDuringFixedBackingRun() public view {
        require(zusd.totalSupply() <= reserve.verifiedReserveUnits(), "mint crossed backing ceiling");
    }
}
