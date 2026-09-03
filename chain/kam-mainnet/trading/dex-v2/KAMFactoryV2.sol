// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../dex/KAMPair.sol";

/// @notice Pre-audit candidate factory that prevents first-pair front-running
/// until the designated pair creator intentionally opens pair creation forever.
contract KAMFactoryV2 {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    address public immutable pairCreator;
    bool public permissionlessPairCreation;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 index);
    event PermissionlessPairCreationEnabled(address indexed pairCreator);

    constructor(address _pairCreator) {
        require(_pairCreator != address(0), "KAMFactoryV2: ZERO_CREATOR");
        pairCreator = _pairCreator;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function enablePermissionlessPairCreation() external {
        require(msg.sender == pairCreator, "KAMFactoryV2: FORBIDDEN");
        require(!permissionlessPairCreation, "KAMFactoryV2: ALREADY_OPEN");
        permissionlessPairCreation = true;
        emit PermissionlessPairCreationEnabled(msg.sender);
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(permissionlessPairCreation || msg.sender == pairCreator, "KAMFactoryV2: CREATION_RESTRICTED");
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
