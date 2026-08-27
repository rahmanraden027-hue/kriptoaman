// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KAMPair.sol";

contract KAMFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 index);

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "KAMFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "KAMFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "KAMFactory: PAIR_EXISTS");

        KAMPair deployed = new KAMPair();
        pair = address(deployed);
        deployed.initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
