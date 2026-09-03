// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex/KAMPair.sol";
import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMRouterV2.sol";
import "./MockToken.sol";

contract FactoryV2Caller {
    function tryCreate(KAMFactoryV2 factory, address tokenA, address tokenB) external returns (bool ok) {
        (ok,) = address(factory).call(abi.encodeWithSelector(factory.createPair.selector, tokenA, tokenB));
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

    function testControlledPhaseRejectsEmptyPairCreation() public {
        bool outsiderOk = outsider.tryCreate(factory, address(tokenA), address(tokenB));
        require(!outsiderOk, "third-party pair creation accepted before open");

        (bool creatorOk,) =
            address(factory).call(abi.encodeWithSelector(factory.createPair.selector, address(tokenA), address(tokenB)));
        require(!creatorOk, "pair creator opened an empty official pair");
        require(factory.allPairsLength() == 0, "empty pair created during controlled phase");
    }

    function testOfficialPairCreationAndFirstSeedAreAtomic() public {
        (address pair, uint256 liquidity) =
            factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 20_000 ether, address(this));

        require(pair != address(0), "pair missing");
        require(factory.getPair(address(tokenA), address(tokenB)) == pair, "pair mapping mismatch");
        require(factory.allPairsLength() == 1, "pair count mismatch");
        require(liquidity > 0, "initial LP missing");
        require(KAMPair(pair).balanceOf(address(this)) == liquidity, "initial LP recipient mismatch");
        require(tokenA.balanceOf(pair) == 10_000 ether, "seed A mismatch");
        require(tokenB.balanceOf(pair) == 20_000 ether, "seed B mismatch");

        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "pair exposed without reserves");
    }

    function testAtomicOfficialSeedCannotRepeatOrRunAfterOpen() public {
        factory.createPairAndSeed(address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, address(this));

        (bool duplicateOk,) = address(factory)
            .call(
                abi.encodeWithSelector(
                    factory.createPairAndSeed.selector,
                    address(tokenA),
                    address(tokenB),
                    1_000 ether,
                    1_000 ether,
                    address(this)
                )
            );
        require(!duplicateOk, "duplicate official pair seeded");

        factory.enablePermissionlessPairCreation();
        (bool afterOpenOk,) = address(factory)
            .call(
                abi.encodeWithSelector(
                    factory.createPairAndSeed.selector,
                    address(tokenA),
                    address(tokenC),
                    1_000 ether,
                    1_000 ether,
                    address(this)
                )
            );
        require(!afterOpenOk, "controlled seed available after permissionless open");
    }

    function testPermissionlessOpeningIsExplicitAndEffective() public {
        require(!factory.permissionlessPairCreation(), "unexpected open state");
        factory.enablePermissionlessPairCreation();
        require(factory.permissionlessPairCreation(), "open state not set");

        bool ok = outsider.tryCreate(factory, address(tokenA), address(tokenC));
        require(ok, "permissionless pair creation not enabled");
        require(factory.getPair(address(tokenA), address(tokenC)) != address(0), "public pair missing");

        (bool secondOpenOk,) =
            address(factory).call(abi.encodeWithSelector(factory.enablePermissionlessPairCreation.selector));
        require(!secondOpenOk, "permissionless opening repeated unexpectedly");
    }

    function testRouterNeverAutoCreatesMissingPair() public {
        (bool ok,) = address(router)
            .call(
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
        (bool ok,) = address(router)
            .call(
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

    function testPublicEmptyPairStillChecksBothInitialMinimums() public {
        factory.enablePermissionlessPairCreation();
        require(outsider.tryCreate(factory, address(tokenA), address(tokenB)), "public pair creation failed");

        (bool aOk,) = address(router)
            .call(
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
        require(!aOk, "initial amountAMin bypassed");

        (bool bOk,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.addLiquidity.selector,
                    address(tokenA),
                    address(tokenB),
                    1_000 ether,
                    1_000 ether,
                    1_000 ether,
                    1_001 ether,
                    address(this),
                    type(uint256).max
                )
            );
        require(!bOk, "initial amountBMin bypassed");
    }

    function testF05AmountAMinBypassIsClosed() public {
        _atomicSeedEqualLiquidity();
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
                    address(this),
                    type(uint256).max
                )
            );
        require(!ok, "F-05 amountBMin bypass still present");
        require(tokenA.balanceOf(address(this)) == aBefore, "A moved on revert");
        require(tokenB.balanceOf(address(this)) == bBefore, "B moved on revert");
    }

    function testValidPostSeedLiquidityStillWorks() public {
        _atomicSeedEqualLiquidity();
        (uint256 amountA, uint256 amountB, uint256 liquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            1_000 ether,
            1_000 ether,
            999 ether,
            999 ether,
            address(this),
            type(uint256).max
        );
        require(amountA == 1_000 ether && amountB == 1_000 ether, "unexpected amounts");
        require(liquidity > 0, "no LP minted");
    }

    function _atomicSeedEqualLiquidity() internal {
        if (factory.getPair(address(tokenA), address(tokenB)) == address(0)) {
            factory.createPairAndSeed(
                address(tokenA), address(tokenB), 10_000 ether, 10_000 ether, address(this)
            );
        }
    }
}
