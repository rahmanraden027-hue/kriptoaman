// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../dex/ZVQFactory.sol";
import "../dex/ZVQRouter.sol";

contract ZVQDEXDeploymentSimulationTest {
    function testSimulateFactoryAndRouterDeployment() public {
        WZVQ wzvq = new WZVQ();
        ZVQFactory factory = new ZVQFactory();
        ZVQRouter router = new ZVQRouter(address(factory), address(wzvq));

        require(address(factory) != address(0), "factory deployment failed");
        require(address(router) != address(0), "router deployment failed");
        require(address(wzvq) != address(0), "WZVQ deployment failed");
        require(router.factory() == address(factory), "router factory binding mismatch");
        require(router.WZVQ() == address(wzvq), "router WZVQ binding mismatch");
        require(factory.allPairsLength() == 0, "unexpected pair created at deployment");
        require(wzvq.totalSupply() == 0, "unexpected WZVQ supply at deployment");
    }

    function testRouterRejectsZeroDeploymentBindings() public {
        ZVQFactory factory = new ZVQFactory();
        WZVQ wzvq = new WZVQ();

        (bool zeroFactoryOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(0), address(wzvq)));
        require(!zeroFactoryOk, "zero factory accepted");

        (bool zeroWZVQOk,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(factory), address(0)));
        require(!zeroWZVQOk, "zero WZVQ accepted");
    }

    function deployRouter(address factory, address wzvq) external returns (address) {
        return address(new ZVQRouter(factory, wzvq));
    }
}
