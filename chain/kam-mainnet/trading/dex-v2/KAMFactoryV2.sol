// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KAMPairV2.sol";
import "../dex/interfaces/IERC20Minimal.sol";

/// @notice Pre-audit candidate factory for atomic pair creation and first liquidity.
/// No empty pair creation path exists: every pair is created and seeded in one transaction.
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

    /// @notice Creates a pair and seeds its first liquidity atomically.
    /// Before permissionless mode opens, only pairCreator may call this function.
    /// After opening, any provider may create and seed a new pair atomically.
    function createPairAndSeed(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        address to
    ) external lock returns (address pair, uint256 liquidity) {
        require(permissionlessPairCreation || msg.sender == pairCreator, "KAMFactoryV2: CREATION_RESTRICTED");
        require(amountA > 0 && amountB > 0, "KAMFactoryV2: ZERO_AMOUNT");
        require(to != address(0), "KAMFactoryV2: ZERO_TO");

        pair = _createPair(tokenA, tokenB);

        uint256 preA = IERC20Minimal(tokenA).balanceOf(pair);
        uint256 preB = IERC20Minimal(tokenB).balanceOf(pair);

        require(IERC20Minimal(tokenA).transferFrom(msg.sender, pair, amountA), "KAMFactoryV2: TRANSFER_A");
        require(IERC20Minimal(tokenB).transferFrom(msg.sender, pair, amountB), "KAMFactoryV2: TRANSFER_B");

        if (tokenA < tokenB) {
            liquidity = KAMPairV2(pair).seed(to, msg.sender, preA, preB, amountA, amountB);
        } else {
            liquidity = KAMPairV2(pair).seed(to, msg.sender, preB, preA, amountB, amountA);
        }

        emit InitialLiquiditySeeded(pair, msg.sender, to, amountA, amountB, liquidity);
    }

    function _createPair(address tokenA, address tokenB) internal returns (address pair) {
        require(tokenA != tokenB, "KAMFactoryV2: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "KAMFactoryV2: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "KAMFactoryV2: PAIR_EXISTS");

        KAMPairV2 deployed = new KAMPairV2();
        pair = address(deployed);
        deployed.initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
