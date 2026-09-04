// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMRouter.sol";

interface VmLiquidity {
    function envUint(string calldata name) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

interface IERC20Approve {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SeedPilotLiquidity {
    VmLiquidity internal constant vm =
        VmLiquidity(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 internal constant KAM_MAINNET_CHAIN_ID = 22028;
    address internal constant CANONICAL_WKAM = 0x0d8848CE88BB09a81a4248Efdd574d50B98b544A;

    function run() external returns (uint256 quoteUsed, uint256 kamUsed, uint256 liquidity) {
        require(block.chainid == KAM_MAINNET_CHAIN_ID, "SeedPilotLiquidity: wrong chain");

        uint256 liquidityPrivateKey = vm.envUint("LIQUIDITY_PRIVATE_KEY");
        address routerAddress = vm.envAddress("KAM_ROUTER_ADDRESS");
        address quoteToken = vm.envAddress("QUOTE_TOKEN_ADDRESS");
        address recipient = vm.envAddress("LIQUIDITY_RECIPIENT");
        uint256 quoteAmount = vm.envUint("QUOTE_AMOUNT_UNITS");
        uint256 kamAmount = vm.envUint("KAM_AMOUNT_WEI");
        uint256 quoteMin = vm.envUint("QUOTE_MIN_UNITS");
        uint256 kamMin = vm.envUint("KAM_MIN_WEI");
        uint256 deadline = vm.envUint("LIQUIDITY_DEADLINE_UNIX");

        require(routerAddress != address(0) && routerAddress.code.length > 0, "SeedPilotLiquidity: router missing");
        require(quoteToken != address(0) && quoteToken.code.length > 0, "SeedPilotLiquidity: quote missing");
        require(quoteToken != CANONICAL_WKAM, "SeedPilotLiquidity: quote is WKAM");
        require(recipient != address(0), "SeedPilotLiquidity: zero recipient");
        require(quoteAmount > 0 && kamAmount > 0, "SeedPilotLiquidity: zero amount");
        require(quoteMin <= quoteAmount && kamMin <= kamAmount, "SeedPilotLiquidity: bad minimum");
        require(deadline >= block.timestamp, "SeedPilotLiquidity: expired");

        KAMRouter router = KAMRouter(payable(routerAddress));
        require(router.WKAM() == CANONICAL_WKAM, "SeedPilotLiquidity: noncanonical WKAM");
        require(router.factory() != address(0) && router.factory().code.length > 0, "SeedPilotLiquidity: factory missing");

        vm.startBroadcast(liquidityPrivateKey);
        require(IERC20Approve(quoteToken).approve(routerAddress, quoteAmount), "SeedPilotLiquidity: approve failed");
        (quoteUsed, kamUsed, liquidity) = router.addLiquidityKAM{value: kamAmount}(
            quoteToken,
            quoteAmount,
            quoteMin,
            kamMin,
            recipient,
            deadline
        );
        vm.stopBroadcast();

        require(quoteUsed > 0 && kamUsed > 0 && liquidity > 0, "SeedPilotLiquidity: empty result");
    }
}
