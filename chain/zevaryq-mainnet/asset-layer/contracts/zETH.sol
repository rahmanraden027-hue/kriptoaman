// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./common/ZControlledERC20.sol";

contract zETH is ZControlledERC20 {
    constructor(address governanceSafe_, address bridgeController_)
        ZControlledERC20("ZEVARYQ Ethereum", "zETH", 18, governanceSafe_, bridgeController_)
    {}
}
