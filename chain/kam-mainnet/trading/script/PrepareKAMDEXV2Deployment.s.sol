// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMRouterV2.sol";

/// @notice Simulation-only preparation helper.
/// Running this with `forge script` without `--broadcast` performs no on-chain transaction.
/// Production deployment remains forbidden until the external-audit and quote-asset gates pass.
contract PrepareKAMDEXV2Deployment {
    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;
    address internal constant CANONICAL_WKAM = 0x0d8848CE88BB09a81a4248Efdd574d50B98b544A;

    function run(address pairCreator) external returns (KAMFactoryV2 factory, KAMRouterV2 router) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "PrepareKAMDEXV2: wrong chain id");
        require(pairCreator != address(0), "PrepareKAMDEXV2: zero pair creator");
        require(CANONICAL_WKAM.code.length > 0, "PrepareKAMDEXV2: WKAM code missing");

        factory = new KAMFactoryV2(pairCreator);
        router = new KAMRouterV2(address(factory), CANONICAL_WKAM);

        require(address(factory).code.length > 0, "PrepareKAMDEXV2: factory simulation failed");
        require(address(router).code.length > 0, "PrepareKAMDEXV2: router simulation failed");
        require(factory.pairCreator() == pairCreator, "PrepareKAMDEXV2: pair creator mismatch");
        require(!factory.permissionlessPairCreation(), "PrepareKAMDEXV2: factory unexpectedly open");
        require(router.factory() == address(factory), "PrepareKAMDEXV2: factory binding mismatch");
        require(router.WKAM() == CANONICAL_WKAM, "PrepareKAMDEXV2: WKAM binding mismatch");
        require(factory.allPairsLength() == 0, "PrepareKAMDEXV2: unexpected pair created");
    }
}
