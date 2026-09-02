// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployKAMDEX {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;
    address internal constant CANONICAL_WKAM = 0x0d8848CE88BB09a81a4248Efdd574d50B98b544A;

    function run() external returns (KAMFactory factory, KAMRouter router) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "DeployKAMDEX: wrong chain id");
        require(CANONICAL_WKAM.code.length > 0, "DeployKAMDEX: WKAM missing");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        factory = new KAMFactory();
        router = new KAMRouter(address(factory), CANONICAL_WKAM);
        vm.stopBroadcast();

        require(address(factory).code.length > 0, "DeployKAMDEX: factory code missing");
        require(address(router).code.length > 0, "DeployKAMDEX: router code missing");
        require(address(router.factory()) == address(factory), "DeployKAMDEX: factory binding mismatch");
        require(address(router.WKAM()) == CANONICAL_WKAM, "DeployKAMDEX: WKAM binding mismatch");
    }
}
