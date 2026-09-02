// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";

contract KAMDEXDeploymentSimulationTest {
    function testSimulateFactoryAndRouterDeployment() public {
        WKAM wkam = new WKAM();
        KAMFactory factory = new KAMFactory();
        KAMRouter router = new KAMRouter(address(factory), address(wkam));

        require(address(factory) != address(0), "factory deployment failed");
        require(address(router) != address(0), "router deployment failed");
        require(address(wkam) != address(0), "WKAM deployment failed");
        require(router.factory() == address(factory), "router factory binding mismatch");
        require(router.WKAM() == address(wkam), "router WKAM binding mismatch");
        require(factory.allPairsLength() == 0, "unexpected pair created at deployment");
        require(wkam.totalSupply() == 0, "unexpected WKAM supply at deployment");
    }

    function testRouterRejectsZeroDeploymentBindings() public {
        KAMFactory factory = new KAMFactory();
        WKAM wkam = new WKAM();

        (bool zeroFactoryOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(0), address(wkam)));
        require(!zeroFactoryOk, "zero factory accepted");

        (bool zeroWKAMOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(factory), address(0)));
        require(!zeroWKAMOk, "zero WKAM accepted");
    }

    function deployRouter(address factory, address wkam) external returns (address) {
        return address(new KAMRouter(factory, wkam));
    }
}
