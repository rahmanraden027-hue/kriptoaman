// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./common/ZControlledERC20.sol";

contract zBTC is ZControlledERC20 {
    constructor(address governanceSafe_, address bridgeController_)
        ZControlledERC20("ZEVARYQ Bitcoin", "zBTC", 8, governanceSafe_, bridgeController_)
    {}
}
