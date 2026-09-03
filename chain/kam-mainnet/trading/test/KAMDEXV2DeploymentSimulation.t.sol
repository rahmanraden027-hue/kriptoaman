// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMRouterV2.sol";

contract KAMDEXV2DeploymentSimulationTest {
    function testSimulateFactoryV2AndRouterV2Deployment() public {
        WKAM wkam = new WKAM();
        address pairCreator = address(0xBEEF);
        KAMFactoryV2 factory = new KAMFactoryV2(pairCreator);
        KAMRouterV2 router = new KAMRouterV2(address(factory), address(wkam));

        require(address(factory) != address(0), "factory deployment failed");
        require(address(router) != address(0), "router deployment failed");
        require(router.factory() == address(factory), "router factory binding mismatch");
        require(router.WKAM() == address(wkam), "router WKAM binding mismatch");
        require(factory.pairCreator() == pairCreator, "pair creator mismatch");
        require(!factory.permissionlessPairCreation(), "factory unexpectedly open");
        require(factory.allPairsLength() == 0, "unexpected pair created at deployment");
        require(wkam.totalSupply() == 0, "unexpected WKAM supply at deployment");
    }

    function testFactoryV2RejectsZeroPairCreator() public {
        (bool ok,) = address(this).call(abi.encodeWithSelector(this.deployFactory.selector, address(0)));
        require(!ok, "zero pair creator accepted");
    }

    function testRouterV2RejectsZeroBindings() public {
        WKAM wkam = new WKAM();
        KAMFactoryV2 factory = new KAMFactoryV2(address(this));

        (bool zeroFactoryOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(0), address(wkam)));
        require(!zeroFactoryOk, "zero factory accepted");

        (bool zeroWKAMOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(factory), address(0)));
        require(!zeroWKAMOk, "zero WKAM accepted");
    }

    function deployFactory(address pairCreator) external returns (address) {
        return address(new KAMFactoryV2(pairCreator));
    }

    function deployRouter(address factory, address wkam) external returns (address) {
        return address(new KAMRouterV2(factory, wkam));
    }
}
