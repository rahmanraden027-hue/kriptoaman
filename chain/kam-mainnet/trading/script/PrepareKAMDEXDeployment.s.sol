// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";

contract PrepareKAMDEXDeployment {
    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;
    address internal constant CANONICAL_WKAM = 0x0d8848CE88BB09a81a4248Efdd574d50B98b544A;

    function run() external returns (KAMFactory factory, KAMRouter router) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "PrepareKAMDEX: wrong chain id");
        require(CANONICAL_WKAM.code.length > 0, "PrepareKAMDEX: WKAM code missing");

        factory = new KAMFactory();
        router = new KAMRouter(address(factory), CANONICAL_WKAM);

        require(address(factory).code.length > 0, "PrepareKAMDEX: factory simulation failed");
        require(address(router).code.length > 0, "PrepareKAMDEX: router simulation failed");
        require(router.factory() == address(factory), "PrepareKAMDEX: factory binding mismatch");
        require(router.WKAM() == CANONICAL_WKAM, "PrepareKAMDEX: WKAM binding mismatch");
        require(factory.allPairsLength() == 0, "PrepareKAMDEX: unexpected pair created");
    }
}
