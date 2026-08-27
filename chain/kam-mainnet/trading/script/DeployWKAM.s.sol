// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployWKAM {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;

    function run() external returns (WKAM deployed) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "DeployWKAM: wrong chain id");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new WKAM();
        vm.stopBroadcast();

        require(address(deployed).code.length > 0, "DeployWKAM: no code");
        require(deployed.totalSupply() == 0, "DeployWKAM: unexpected supply");
    }
}
