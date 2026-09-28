// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../contracts/ZVQFactory.sol";
import "../contracts/ZVQRouter.sol";

contract ZVQDEXDeploymentSimulationTest {
    function testSimulateCandidateDeployment() public {
        WZVQ wzvq = new WZVQ();
        ZVQFactory factory = new ZVQFactory();
        ZVQRouter router = new ZVQRouter(address(factory), address(wzvq));

        require(address(wzvq).code.length > 0, "WZVQ code missing");
        require(address(factory).code.length > 0, "factory code missing");
        require(address(router).code.length > 0, "router code missing");
        require(router.factory() == address(factory), "factory binding");
        require(router.WZVQ() == address(wzvq), "WZVQ binding");
        require(router.WETH() == address(wzvq), "compat alias binding");
        require(factory.allPairsLength() == 0, "unexpected pair");
        require(wzvq.totalSupply() == 0, "unexpected wrapped supply");
    }

    function testRejectsZeroBindings() public {
        WZVQ wzvq = new WZVQ();
        ZVQFactory factory = new ZVQFactory();

        (bool zeroFactory,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(0), address(wzvq)));
        require(!zeroFactory, "zero factory accepted");

        (bool zeroWzvq,) =
            address(this).call(abi.encodeWithSelector(this.deployRouter.selector, address(factory), address(0)));
        require(!zeroWzvq, "zero WZVQ accepted");
    }

    function deployRouter(address factory, address wzvq) external returns (address) {
        return address(new ZVQRouter(factory, wzvq));
    }
}
