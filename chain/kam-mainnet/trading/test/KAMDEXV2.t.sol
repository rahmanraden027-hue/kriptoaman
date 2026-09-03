// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMPairV2.sol";
import "../dex-v2/KAMRouterV2.sol";
import "./MockToken.sol";

contract FactoryV2Caller {
    function tryCreateAndSeed(
        KAMFactoryV2 factory,
        MockToken tokenA,
        MockToken tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns (bool ok, address pair) {
        tokenA.approve(address(factory), amountA);
        tokenB.approve(address(factory), amountB);
        bytes memory data;
        (ok, data) = address(factory).call(
            abi.encodeWithSelector(
                factory.createPairAndSeed.selector,
                address(tokenA),
                address(tokenB),
                amountA,
                amountB,
                address(this)
            )
        );
        if (ok) (pair,) = abi.decode(data, (address, uint256));
    }
}

contract KAMDEXV2Test {
    KAMFactoryV2 factory;
    KAMRouterV2 router;
    WKAM canonicalWKAM;
    MockToken tokenA;
    MockToken tokenB;
    MockToken tokenC;
    FactoryV2Caller outsider;

    function setUp() public {
        canonicalWKAM = new WKAM();
        factory = new KAMFactoryV2(address(this));
        router = new KAMRouterV2(address(factory), address(canonicalWKAM));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");
        tokenC = new MockToken("Token C", "TKC");
        outsider = new FactoryV2Caller();

        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenC.mint(address(this), 1_000_000 ether);

        tokenA.approve(address(factory), type(uint256).max);
        tokenB.approve(address(factory), type(uint256).max);
        tokenC.approve(address(factory), type(uint256).max);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        tokenC.approve(address(router), type(uint256).max);
    }

    function testV2PinsFactoryAndWKAM() public view {
        require(router.factory() == address(factory), "factory mismatch");
        require(router.WKAM() == address(canonicalWKAM), "WKAM mismatch");
        require(factory.pairCreator() == address(this), "pair creator mismatch");
        require(!factory.permissionlessPairCreation(), "unexpected permissionless mode");
    }

    function testControlledPhaseRejectsThirdPartyPairAndSeed() public {
        tokenA.transfer(address(outsider), 2_000 ether);
        tokenB.transfer(address(outsider), 2_000 ether);
        (bool ok, address pair) = outsider.tryCreateAndSeed(factory, tokenA, tokenB, 1_000 ether, 1_000 ether);
        require(!ok && pair == address(0), "third-party launch accepted before open");
        require(factory.allPairsLength() == 0, "pair created during controlled phase");
    }

    function testOfficialPairCreationAndFirstSeedAreAtomic() public {
        (address pair, uint256 liquidity) =
            factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 20_000 ether, address(this));

        require(pair != address(0), "pair missing");
        require(factory.getPair(address(tokenA), address(tokenB)) == pair, "pair mapping mismatch");
        require(factory.allPairsLength() == 1, "pair count mismatch");
        require(liquidity > 0, "initial LP missing");
        require(KAMPairV2(pair).initialSeeded(), "pair not marked seeded");
        require(KAMPairV2(pair).balanceOf(address(this)) == liquidity, "initial LP recipient mismatch");
        require(tokenA.balanceOf(pair) == 10_000 ether, "seed A mismatch");
        require(tokenB.balanceOf(pair) == 20_000 ether, "seed B mismatch");

        (uint112 reserve0, uint112 reserve1,) = KAMPairV2(pair).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "pair exposed without reserves");
    }

    function testCounterfactualPrefundIsRecoveredBeforeOfficialSeed() public {
        address predicted = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", address(factory), hex"01")))));
        uint256 balanceBefore = tokenA.balanceOf(address(this));
        tokenA.transfer(predicted, 7 ether);
        require(tokenA.balanceOf(predicted) == 7 ether, "prefund missing");

        (address pair,) =
            factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 20_000 ether, address(this));

        require(pair == predicted, "unexpected first CREATE address");
        require(tokenA.balanceOf(pair) == 10_000 ether, "prefund distorted official A reserve");
        require(tokenB.balanceOf(pair) == 20_000 ether, "official B reserve mismatch");
        require(tokenA.balanceOf(address(this)) == balanceBefore - 10_000 ether, "prefund not recovered");
    }

    function testDuplicatePairAndSeedIsRejected() public {
        factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, address(this));
        (bool ok,) = address(factory).call(
            abi.encodeWithSelector(
                factory.createPairAndSeed.selector,
                address(tokenA),
                address(tokenB),
                1_000 ether,
                1_000 ether,
                address(this)
            )
        );
        require(!ok, "duplicate pair seeded");
    }

    function testPermissionlessOpeningIsExplicitAndStillAtomic() public {
        factory.enablePermissionlessPairCreation();
        require(factory.permissionlessPairCreation(), "open state not set");

        tokenA.transfer(address(outsider), 2_000 ether);
        tokenC.transfer(address(outsider), 2_000 ether);
        (bool ok, address pair) = outsider.tryCreateAndSeed(factory, tokenA, tokenC, 1_000 ether, 1_000 ether);
        require(ok && pair != address(0), "permissionless atomic pair creation failed");
        require(KAMPairV2(pair).initialSeeded(), "permissionless pair exposed unseeded");

        (bool secondOpenOk,) =
            address(factory).call(abi.encodeWithSelector(factory.enablePermissionlessPairCreation.selector));
        require(!secondOpenOk, "permissionless opening repeated unexpectedly");
    }

    function testRouterNeverAutoCreatesMissingPair() public {
        (bool ok,) = address(router).call(
            abi.encodeWithSelector(
                router.addLiquidity.selector,
                address(tokenA),
                address(tokenB),
                1_000 ether,
                1_000 ether,
                1_000 ether,
                1_000 ether,
                address(this),
                type(uint256).max
            )
        );
        require(!ok, "router auto-created missing pair");
        require(factory.allPairsLength() == 0, "missing pair was created");
    }

    function testExpiredDeadlineIsRejected() public {
        _atomicSeedEqualLiquidity();
        (bool ok,) = address(router).call(
            abi.encodeWithSelector(
                router.addLiquidity.selector,
                address(tokenA),
                address(tokenB),
                1_000 ether,
                1_000 ether,
                1_000 ether,
                1_000 ether,
                address(this),
                0
            )
        );
        require(!ok, "expired transaction accepted");
    }

    function testF05AmountAMinBypassIsClosed() public {
        _atomicSeedEqualLiquidity();
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));

        (bool ok,) = address(router).call(
            abi.encodeWithSelector(
                router.addLiquidity.selector,
                address(tokenA),
                address(tokenB),
                1_000 ether,
                1_000 ether,
                1_001 ether,
                1_000 ether,
                address(this),
                type(uint256).max
            )
        );
        require(!ok, "F-05 amountAMin bypass still present");
        require(tokenA.balanceOf(address(this)) == aBefore, "A moved on revert");
        require(tokenB.balanceOf(address(this)) == bBefore, "B moved on revert");
    }

    function testF05AmountBMinBypassIsClosed() public {
        _atomicSeedEqualLiquidity();
        uint256 aBefore = tokenA.balanceOf(address(this));
        uint256 bBefore = tokenB.balanceOf(address(this));

        (bool ok,) = address(router).call(
            abi.encodeWithSelector(
                router.addLiquidity.selector,
                address(tokenA),
                address(tokenB),
                1_000 ether,
                500 ether,
                500 ether,
                501 ether,
                address(this),
                type(uint256).max
            )
        );
        require(!ok, "F-05 amountBMin bypass still present");
        require(tokenA.balanceOf(address(this)) == aBefore, "A moved on revert");
        require(tokenB.balanceOf(address(this)) == bBefore, "B moved on revert");
    }

    function testValidPostSeedLiquiditySwapAndRemovalWork() public {
        _atomicSeedEqualLiquidity();
        address pair = factory.getPair(address(tokenA), address(tokenB));

        (uint256 amountA, uint256 amountB, uint256 addedLiquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            1_000 ether,
            1_000 ether,
            999 ether,
            999 ether,
            address(this),
            type(uint256).max
        );
        require(amountA == 1_000 ether && amountB == 1_000 ether, "unexpected add amounts");
        require(addedLiquidity > 0, "no LP minted");

        uint256 bBefore = tokenB.balanceOf(address(this));
        uint256 out = router.swapExactTokensForTokens(
            100 ether, 1, address(tokenA), address(tokenB), address(this), type(uint256).max
        );
        require(out > 0 && tokenB.balanceOf(address(this)) == bBefore + out, "swap failed");

        uint256 removable = KAMPairV2(pair).balanceOf(address(this)) / 10;
        KAMPairV2(pair).approve(address(router), removable);
        (uint256 removedA, uint256 removedB) = router.removeLiquidity(
            address(tokenA), address(tokenB), removable, 1, 1, address(this), type(uint256).max
        );
        require(removedA > 0 && removedB > 0, "remove liquidity failed");
    }

    function _atomicSeedEqualLiquidity() internal {
        if (factory.getPair(address(tokenA), address(tokenB)) == address(0)) {
            factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, address(this));
        }
    }
}
