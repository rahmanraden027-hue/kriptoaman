// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex/KAMFactory.sol";
import "../dex/KAMRouter.sol";
import "./MockToken.sol";

/// @notice Reproduction tests for audit finding F-05.
/// These tests intentionally document the currently deployed Router semantics.
/// They do not assert that the behavior is desirable and do not modify contract source.
contract KAMDEXF05Test {
    KAMFactory factory;
    KAMRouter router;
    WKAM canonicalWKAM;
    MockToken tokenA;
    MockToken tokenB;

    function setUp() public {
        factory = new KAMFactory();
        canonicalWKAM = new WKAM();
        router = new KAMRouter(address(factory), address(canonicalWKAM));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);

        router.addLiquidity(
            address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, 10_000 ether, 10_000 ether, address(this)
        );
    }

    /// @dev When amountBOptimal <= amountBDesired, _optimalAmounts checks B_MIN
    /// but does not check amountADesired against amountAMin. This call therefore
    /// succeeds even though amountAMin is greater than the amountA actually supplied.
    function testF05ReproducesAmountAMinBypassWhenAIsFullyConsumed() public {
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));

        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    1_000 ether,
                    1_000 ether,
                    1_001 ether,
                    1_000 ether,
                    address(this)
                )
            );

        require(ok, "F-05 reproduction changed: amountAMin now enforced");
        require(aBefore - tokenA.balanceOf(address(this)) == 1_000 ether, "unexpected A consumption");
        require(bBefore - tokenB.balanceOf(address(this)) == 1_000 ether, "unexpected B consumption");
    }

    /// @dev When amountBOptimal > amountBDesired, _optimalAmounts checks A_MIN
    /// but does not check amountBDesired against amountBMin. This call therefore
    /// succeeds even though amountBMin is greater than the amountB actually supplied.
    function testF05ReproducesAmountBMinBypassWhenBIsFullyConsumed() public {
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));

        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    1_000 ether,
                    500 ether,
                    500 ether,
                    501 ether,
                    address(this)
                )
            );

        require(ok, "F-05 reproduction changed: amountBMin now enforced");
        require(aBefore - tokenA.balanceOf(address(this)) == 500 ether, "unexpected A consumption");
        require(bBefore - tokenB.balanceOf(address(this)) == 500 ether, "unexpected B consumption");
    }
}
