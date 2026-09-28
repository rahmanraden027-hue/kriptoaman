// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./common/ZControlledERC20.sol";

contract ZUSD is ZControlledERC20 {
    constructor(address governanceSafe_, address reserveController_)
        ZControlledERC20("ZEVARYQ USD", "ZUSD", 6, governanceSafe_, reserveController_)
    {}
}
