// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex/KAMFactory.sol";
import "../dex/KAMPair.sol";
import "../dex/KAMRouter.sol";
import "./MockToken.sol";

interface VmFuzz {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
}

contract ReentrantMockToken {
    string public constant name = "Reentrant Test Token";
    string public constant symbol = "RNT";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public targetPair;
    bool public reentryEnabled;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function setTargetPair(address pair) external {
        targetPair = pair;
    }

    function setReentryEnabled(bool enabled) external {
        reentryEnabled = enabled;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (msg.sender == targetPair && reentryEnabled && !reentryAttempted) {
            reentryAttempted = true;
            (bool ok,) =
                targetPair.call(abi.encodeWithSelector(KAMPair.swap.selector, uint256(1), uint256(0), address(this)));
            reentrySucceeded = ok;
        }
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "RNT: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "RNT: ZERO_TO");
        require(balanceOf[from] >= amount, "RNT: BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract KAMDEXFuzzInvariantTest {
    VmFuzz internal constant vm = VmFuzz(address(uint160(uint256(keccak256("hevm cheat code")))));

    KAMFactory internal factory;
    KAMRouter internal router;
    WKAM internal canonicalWKAM;
    MockToken internal tokenA;
    MockToken internal tokenB;

    address internal constant ALICE = address(0xA11CE);
    uint256 internal constant USER_TOKEN_BALANCE = 20_000_000 ether;
    uint256 internal constant USER_NATIVE_BALANCE = 20_000_000 ether;
    uint256 internal constant DEADLINE = type(uint256).max;

    function setUp() public {
        factory = new KAMFactory();
        canonicalWKAM = new WKAM();
        router = new KAMRouter(address(factory), address(canonicalWKAM));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        tokenA.mint(ALICE, USER_TOKEN_BALANCE);
        tokenB.mint(ALICE, USER_TOKEN_BALANCE);
        vm.deal(ALICE, USER_NATIVE_BALANCE);

        vm.prank(ALICE);
        tokenA.approve(address(router), type(uint256).max);
        vm.prank(ALICE);
        tokenB.approve(address(router), type(uint256).max);
    }

    function _bound(uint256 value, uint256 minValue, uint256 maxValue) internal pure returns (uint256) {
        require(maxValue >= minValue, "bad bound");
        return minValue + (value % (maxValue - minValue + 1));
    }

    function _reservesFor(address pair, address tokenIn, address tokenOut)
        internal
        view
        returns (uint256 reserveIn, uint256 reserveOut)
    {
        (uint112 reserve0, uint112 reserve1,) = KAMPair(pair).getReserves();
        if (tokenIn < tokenOut) return (reserve0, reserve1);
        return (reserve1, reserve0);
    }

    function testFuzzSwapPreservesConstantProduct(uint96 liquiditySeed, uint96 swapSeed) public {
        uint256 baseLiquidity = _bound(uint256(liquiditySeed), 10 ether, 1_000_000 ether);

        vm.prank(ALICE);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            ALICE,
            DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = KAMPair(pair).getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);

        uint256 amountIn = _bound(uint256(swapSeed), 1e12, baseLiquidity / 5);
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, address(tokenA), address(tokenB));
        uint256 expectedOut = router.getAmountOut(amountIn, reserveIn, reserveOut);
        require(expectedOut > 0 && expectedOut < reserveOut, "invalid expected output");

        vm.prank(ALICE);
        uint256 actualOut =
            router.swapExactTokensForTokens(amountIn, expectedOut, address(tokenA), address(tokenB), ALICE, DEADLINE);
        require(actualOut == expectedOut, "router output mismatch");

        (uint112 r0After, uint112 r1After,) = KAMPair(pair).getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);
        require(kAfter >= kBefore, "constant product decreased");
    }

    function testFuzzFailedSlippageSwapIsAtomic(uint96 liquiditySeed, uint96 swapSeed) public {
        uint256 baseLiquidity = _bound(uint256(liquiditySeed), 10 ether, 1_000_000 ether);

        vm.prank(ALICE);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            ALICE,
            DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = KAMPair(pair).getReserves();
        uint256 aliceTokenBefore = tokenA.balanceOf(ALICE);
        uint256 amountIn = _bound(uint256(swapSeed), 1e12, baseLiquidity / 5);
        (uint256 reserveIn, uint256 reserveOut) = _reservesFor(pair, address(tokenA), address(tokenB));
        uint256 expectedOut = router.getAmountOut(amountIn, reserveIn, reserveOut);

        vm.prank(ALICE);
        (bool ok,) = address(router)
            .call(
                abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector,
                    amountIn,
                    expectedOut + 1,
                    address(tokenA),
                    address(tokenB),
                    ALICE,
                    DEADLINE
                )
            );
        require(!ok, "slippage bypassed");

        (uint112 r0After, uint112 r1After,) = KAMPair(pair).getReserves();
        require(r0After == r0Before && r1After == r1Before, "reserves changed on revert");
        require(tokenA.balanceOf(ALICE) == aliceTokenBefore, "input token changed on revert");
    }

    function testFuzzLiquidityRoundTripNeverOverReturns(uint96 liquiditySeed) public {
        uint256 baseLiquidity = _bound(uint256(liquiditySeed), 10 ether, 1_000_000 ether);

        vm.prank(ALICE);
        (,, uint256 liquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            baseLiquidity,
            ALICE,
            DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        vm.prank(ALICE);
        KAMPair(pair).approve(address(router), liquidity);

        vm.prank(ALICE);
        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 1, 1, ALICE, DEADLINE);

        require(amountA > 0 && amountB > 0, "zero round-trip output");
        require(amountA <= baseLiquidity && amountB <= baseLiquidity, "round trip over-returned assets");
        require(KAMPair(pair).balanceOf(ALICE) == 0, "user LP remains after full burn");
        require(KAMPair(pair).totalSupply() == KAMPair(pair).MINIMUM_LIQUIDITY(), "minimum LP lock changed");
    }

    function testFuzzSecondLiquidityMintMatchesProRataFormula(uint96 initialSeed, uint96 topUpSeed) public {
        uint256 initialLiquidity = _bound(uint256(initialSeed), 10 ether, 1_000_000 ether);
        uint256 topUp = _bound(uint256(topUpSeed), 1 ether, initialLiquidity / 2);

        vm.prank(ALICE);
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            initialLiquidity,
            initialLiquidity,
            initialLiquidity,
            initialLiquidity,
            ALICE,
            DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint256 reserveA,) = _reservesFor(pair, address(tokenA), address(tokenB));
        uint256 supplyBefore = KAMPair(pair).totalSupply();
        uint256 expectedLiquidity = (topUp * supplyBefore) / reserveA;

        vm.prank(ALICE);
        (uint256 amountA, uint256 amountB, uint256 minted) =
            router.addLiquidity(address(tokenA), address(tokenB), topUp, topUp, 0, 0, ALICE, DEADLINE);

        require(amountA == topUp && amountB == topUp, "equal reserve ratio not preserved");
        require(minted == expectedLiquidity, "LP pro-rata mint mismatch");
    }

    function testFuzzGetAmountOutIsMonotonic(
        uint96 reserveInSeed,
        uint96 reserveOutSeed,
        uint96 inputSeed,
        uint96 deltaSeed
    ) public view {
        uint256 reserveIn = _bound(uint256(reserveInSeed), 1e12, 1e28);
        uint256 reserveOut = _bound(uint256(reserveOutSeed), 1e12, 1e28);
        uint256 amountIn1 = _bound(uint256(inputSeed), 1, 1e20);
        uint256 delta = _bound(uint256(deltaSeed), 1, 1e20);
        uint256 amountIn2 = amountIn1 + delta;

        uint256 out1 = router.getAmountOut(amountIn1, reserveIn, reserveOut);
        uint256 out2 = router.getAmountOut(amountIn2, reserveIn, reserveOut);

        require(out2 >= out1, "larger input produced smaller output");
        require(out1 < reserveOut && out2 < reserveOut, "output exhausted reserve");
    }

    function testFuzzNativeKAMRefundAndWKAMBacking(uint96 initialSeed, uint96 topUpSeed) public {
        uint256 initialLiquidity = _bound(uint256(initialSeed), 10 ether, 1_000 ether);
        uint256 topUp = _bound(uint256(topUpSeed), 1 ether, initialLiquidity / 2);

        vm.prank(ALICE);
        router.addLiquidityKAM{value: initialLiquidity}(
            address(tokenA), initialLiquidity, initialLiquidity, initialLiquidity, ALICE, DEADLINE
        );

        uint256 nativeBefore = ALICE.balance;
        vm.prank(ALICE);
        (uint256 amountToken, uint256 amountKAM,) =
            router.addLiquidityKAM{value: topUp * 2}(address(tokenA), topUp, 0, 0, ALICE, DEADLINE);

        require(amountToken == topUp && amountKAM == topUp, "unexpected optimal native ratio");
        require(nativeBefore - ALICE.balance == amountKAM, "excess native KAM was not refunded");
        require(address(router).balance == 0, "router retained native KAM");
        require(address(canonicalWKAM).balance == canonicalWKAM.totalSupply(), "WKAM backing mismatch");
    }

    function testPairReentrancyLockBlocksTokenCallback() public {
        ReentrantMockToken reentrant = new ReentrantMockToken();
        reentrant.mint(ALICE, 1_000_000 ether);

        vm.prank(ALICE);
        reentrant.approve(address(router), type(uint256).max);

        vm.prank(ALICE);
        router.addLiquidity(
            address(reentrant), address(tokenB), 10_000 ether, 10_000 ether, 10_000 ether, 10_000 ether, ALICE, DEADLINE
        );

        address pair = factory.getPair(address(reentrant), address(tokenB));
        reentrant.setTargetPair(pair);
        reentrant.setReentryEnabled(true);

        vm.prank(ALICE);
        uint256 out =
            router.swapExactTokensForTokens(100 ether, 1, address(tokenB), address(reentrant), ALICE, DEADLINE);

        require(out > 0, "outer swap failed");
        require(reentrant.reentryAttempted(), "callback did not attempt reentry");
        require(!reentrant.reentrySucceeded(), "pair reentrancy lock bypassed");
    }
}
