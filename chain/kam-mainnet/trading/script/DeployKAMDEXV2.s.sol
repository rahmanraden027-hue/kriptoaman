// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMRouterV2.sol";

interface VmV2 {
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployKAMDEXV2 {
    VmV2 internal constant vm = VmV2(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;
    address internal constant CANONICAL_WKAM = 0x0d8848CE88BB09a81a4248Efdd574d50B98b544A;

    function run(address pairCreator) external returns (KAMFactoryV2 factory, KAMRouterV2 router) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "DeployKAMDEXV2: wrong chain id");
        require(pairCreator != address(0), "DeployKAMDEXV2: zero pair creator");
        require(CANONICAL_WKAM.code.length > 0, "DeployKAMDEXV2: WKAM missing");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        factory = new KAMFactoryV2(pairCreator);
        router = new KAMRouterV2(address(factory), CANONICAL_WKAM);
        vm.stopBroadcast();

        require(address(factory).code.length > 0, "DeployKAMDEXV2: factory code missing");
        require(address(router).code.length > 0, "DeployKAMDEXV2: router code missing");
        require(factory.pairCreator() == pairCreator, "DeployKAMDEXV2: pair creator mismatch");
        require(!factory.permissionlessPairCreation(), "DeployKAMDEXV2: unexpected open state");
        require(factory.allPairsLength() == 0, "DeployKAMDEXV2: unexpected pair created");
        require(router.factory() == address(factory), "DeployKAMDEXV2: factory binding mismatch");
        require(router.WKAM() == CANONICAL_WKAM, "DeployKAMDEXV2: WKAM binding mismatch");
    }
}
