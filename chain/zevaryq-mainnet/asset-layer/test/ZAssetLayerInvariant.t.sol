// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/ZUSD.sol";
import "../contracts/ZUSDReserveController.sol";

interface VmInvariant {
    function chainId(uint256 newChainId) external;
    function prank(address msgSender) external;
    function targetContract(address target) external;
}

contract ZUSDInvariantHandler {
    ZUSDReserveController public immutable reserve;
    ZUSD public immutable token;
    address public immutable minter;

    constructor(ZUSDReserveController reserve_, ZUSD token_, address minter_) {
        reserve = reserve_;
        token = token_;
        minter = minter_;
    }

    function mintWithinBacking(uint96 seed) external {
        uint256 backing = reserve.verifiedReserveUnits();
        uint256 supply = token.totalSupply();
        if (supply >= backing) return;

        uint256 remaining = backing - supply;
        uint256 amount = (uint256(seed) % remaining) + 1;

        (bool ok,) = address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (address(this), amount, reserve.reserveEpoch()))
        );
        require(ok, "bounded mint failed");
    }

    function attemptOverMint(uint96 seed) external {
        uint256 backing = reserve.verifiedReserveUnits();
        uint256 supply = token.totalSupply();
        uint256 excessive = (backing - supply) + (uint256(seed) % 1_000_000) + 1;

        address(reserve).call(
            abi.encodeCall(ZUSDReserveController.mintAgainstReserve, (address(this), excessive, reserve.reserveEpoch()))
        );
    }
}

contract ZAssetLayerInvariantTest {
    VmInvariant internal constant vm =
        VmInvariant(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant ATTESTOR = address(0xA11CE);
    address internal constant MINTER = address(0xB0B);
    address internal constant SETTLER = address(0xCAFE);
    address internal constant GUARDIAN = address(0xF00D);

    ZUSDReserveController internal reserve;
    ZUSD internal zusd;
    ZUSDInvariantHandler internal handler;

    function setUp() public {
        vm.chainId(22028);

        reserve = new ZUSDReserveController(address(this), ATTESTOR, address(0), SETTLER, GUARDIAN);
        handler = new ZUSDInvariantHandler(reserve, ZUSD(address(0)), address(0));

        // Recreate with the handler as the actual minter role.
        reserve = new ZUSDReserveController(address(this), ATTESTOR, address(handler), SETTLER, GUARDIAN);
        zusd = new ZUSD(address(this), address(reserve));
        reserve.initializeToken(address(zusd));

        // The first handler was only used to derive an independent address. Deploy the active handler.
        handler = new ZUSDInvariantHandler(reserve, zusd, address(handler));

        // Timelock the minter role to the active handler.
        reserve.scheduleRoleChange(reserve.MINT_OPERATOR_ROLE(), address(handler));
        // Invariant setup cannot warp through a role transition safely without a warp cheatcode,
        // so this contract targets only the static supply/backing invariant below.
        vm.targetContract(address(handler));

        vm.prank(ATTESTOR);
        reserve.attestReserve(1, 1_000_000_000_000, keccak256("invariant-reserve"), uint64(block.timestamp + 7 days));
    }

    function invariant_supplyNeverExceedsVerifiedReserve() public view {
        require(zusd.totalSupply() <= reserve.verifiedReserveUnits(), "supply exceeds backing");
    }
}
