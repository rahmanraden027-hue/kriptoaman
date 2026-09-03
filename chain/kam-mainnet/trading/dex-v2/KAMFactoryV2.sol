// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMPair.sol";
import "../dex/interfaces/IERC20Minimal.sol";

/// @notice Pre-audit candidate factory for controlled first-liquidity launch.
/// Official launch pairs are created and initially seeded atomically by pairCreator.
/// Empty permissionless pair creation is available only after an explicit irreversible open action.
contract KAMFactoryV2 {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    address public immutable pairCreator;
    bool public permissionlessPairCreation;
    uint256 private unlocked = 1;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 index);
    event InitialLiquiditySeeded(
        address indexed pair,
        address indexed provider,
        address indexed to,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event PermissionlessPairCreationEnabled(address indexed pairCreator);

    modifier lock() {
        require(unlocked == 1, "KAMFactoryV2: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor(address _pairCreator) {
        require(_pairCreator != address(0), "KAMFactoryV2: ZERO_CREATOR");
        pairCreator = _pairCreator;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function enablePermissionlessPairCreation() external lock {
        require(msg.sender == pairCreator, "KAMFactoryV2: FORBIDDEN");
        require(!permissionlessPairCreation, "KAMFactoryV2: ALREADY_OPEN");
        permissionlessPairCreation = true;
        emit PermissionlessPairCreationEnabled(msg.sender);
    }

    /// @notice Public pair creation is intentionally unavailable during the controlled launch phase.
    function createPair(address tokenA, address tokenB) external lock returns (address pair) {
        require(permissionlessPairCreation, "KAMFactoryV2: CREATION_RESTRICTED");
        pair = _createPair(tokenA, tokenB);
    }

    /// @notice Creates the official pair and seeds its first liquidity in the same transaction.
    /// The pairCreator must pre-approve this factory for both ERC-20 assets, including WKAM.
    /// Fee-on-transfer/rebasing behavior is rejected by exact post-transfer balance checks.
    function createPairAndSeed(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        address to
    ) external lock returns (address pair, uint256 liquidity) {
        require(msg.sender == pairCreator, "KAMFactoryV2: FORBIDDEN");
        require(!permissionlessPairCreation, "KAMFactoryV2: LAUNCH_PHASE_CLOSED");
        require(amountA > 0 && amountB > 0, "KAMFactoryV2: ZERO_AMOUNT");
        require(to != address(0), "KAMFactoryV2: ZERO_TO");

        pair = _createPair(tokenA, tokenB);

        require(IERC20Minimal(tokenA).transferFrom(msg.sender, pair, amountA), "KAMFactoryV2: TRANSFER_A");
        require(IERC20Minimal(tokenB).transferFrom(msg.sender, pair, amountB), "KAMFactoryV2: TRANSFER_B");
        require(IERC20Minimal(tokenA).balanceOf(pair) == amountA, "KAMFactoryV2: NON_STANDARD_A");
        require(IERC20Minimal(tokenB).balanceOf(pair) == amountB, "KAMFactoryV2: NON_STANDARD_B");

        liquidity = KAMPair(pair).mint(to);
        emit InitialLiquiditySeeded(pair, msg.sender, to, amountA, amountB, liquidity);
    }

    function _createPair(address tokenA, address tokenB) internal returns (address pair) {
        require(tokenA != tokenB, "KAMFactoryV2: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "KAMFactoryV2: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "KAMFactoryV2: PAIR_EXISTS");

        KAMPair deployed = new KAMPair();
        pair = address(deployed);
        deployed.initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
