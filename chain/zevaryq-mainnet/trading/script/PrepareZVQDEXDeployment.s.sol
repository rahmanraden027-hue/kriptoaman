// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../contracts/ZVQFactory.sol";
import "../contracts/ZVQRouter.sol";

interface VmPreSign {
    function envAddress(string calldata name) external returns (address);
    function startBroadcast(address signer) external;
    function stopBroadcast() external;
}

/// @title Prepare ZEVARYQ DEX Deployment
/// @notice Live-chain simulation only. This script never reads a private key and is not broadcast by CI.
contract PrepareZVQDEXDeployment {
    VmPreSign internal constant vm =
        VmPreSign(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 internal constant ZEVARYQ_CHAIN_ID = 22028;

    function run() external returns (WZVQ wzvq, ZVQFactory factory, ZVQRouter router) {
        require(block.chainid == ZEVARYQ_CHAIN_ID, "PrepareZVQDEXDeployment: wrong chain");
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        require(deployer != address(0), "PrepareZVQDEXDeployment: zero deployer");

        // startBroadcast(address) records/simulates deployment transactions from
        // the reviewed signer address. CI never passes --broadcast and has no key.
        vm.startBroadcast(deployer);
        wzvq = new WZVQ();
        factory = new ZVQFactory();
        router = new ZVQRouter(address(factory), address(wzvq));
        vm.stopBroadcast();

        require(address(wzvq).code.length > 0, "WZVQ code missing");
        require(address(factory).code.length > 0, "factory code missing");
        require(address(router).code.length > 0, "router code missing");
        require(wzvq.totalSupply() == 0, "unexpected WZVQ supply");
        require(factory.allPairsLength() == 0, "unexpected pair");
        require(router.factory() == address(factory), "factory binding mismatch");
        require(router.WZVQ() == address(wzvq), "WZVQ binding mismatch");
        require(router.WETH() == address(wzvq), "V2 alias binding mismatch");
    }
}
