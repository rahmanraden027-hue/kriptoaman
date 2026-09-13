// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/SKAM.sol";

interface VmSKAMDeploy {
    function envUint(string calldata name) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeploySKAM {
    VmSKAMDeploy internal constant vm = VmSKAMDeploy(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;

    function run() external returns (SKAM deployed) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "DeploySKAM: wrong chain id");

        address wkam = vm.envAddress("WKAM_ADDRESS");
        require(wkam != address(0), "DeploySKAM: zero WKAM");
        require(wkam.code.length > 0, "DeploySKAM: WKAM has no code");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new SKAM(wkam);
        vm.stopBroadcast();

        require(address(deployed).code.length > 0, "DeploySKAM: no code");
        require(deployed.asset() == wkam, "DeploySKAM: asset mismatch");
        require(deployed.totalSupply() == 0, "DeploySKAM: unexpected supply");
        require(deployed.totalAssets() == 0, "DeploySKAM: unexpected assets");
    }
}
