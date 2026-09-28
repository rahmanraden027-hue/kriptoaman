// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WZVQ.sol";
import "../contracts/ZVQFactory.sol";
import "../contracts/ZVQPair.sol";
import "../contracts/ZVQRouter.sol";
import "./MockToken.sol";

interface VmZVQFuzz {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
}

contract ReentrantTokenZVQ {
    string public constant name = "Reentrant Test Token";
    string public constant symbol = "RNT";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public targetPair;
    bool public enabled;
    bool public attempted;
    bool public succeeded;

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function setTargetPair(address pair) external { targetPair = pair; }
    function setEnabled(bool value) external { enabled = value; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (msg.sender == targetPair && enabled && !attempted) {
            attempted = true;
            (bool ok,) = targetPair.call(
                abi.encodeWithSelector(ZVQPair.swap.selector, uint256(1), uint256(0), address(this))
            );
            succeeded = ok;
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
    }
}

contract ZVQDEXFuzzInvariantTest {
    VmZVQFuzz internal constant vm = VmZVQFuzz(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant ALICE = address(0xA11CE);
    uint256 internal constant DEADLINE = type(uint256).max;

    WZVQ internal wzvq;
    ZVQFactory internal factory;
    ZVQRouter internal router;
    MockToken internal tokenA;
    MockToken internal tokenB;

    function setUp() public {
        wzvq = new WZVQ();
        factory = new ZVQFactory();
        router = new ZVQRouter(address(factory), address(wzvq));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        tokenA.mint(ALICE, 20_000_000 ether);
        tokenB.mint(ALICE, 20_000_000 ether);
        vm.deal(ALICE, 20_000_000 ether);

        vm.prank(ALICE);
        tokenA.approve(address(router), type(uint256).max);
        vm.prank(ALICE);
        tokenB.approve(address(router), type(uint256).max);
    }

    function _bound(uint256 value, uint256 minValue, uint256 maxValue) internal pure returns (uint256) {
        return minValue + (value % (maxValue - minValue + 1));
    }

    function _path(address a, address b) internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = a;
        path[1] = b;
    }

    function testFuzzSwapPreservesConstantProduct(uint96 liquiditySeed, uint96 swapSeed) public {
        uint256 liquidity = _bound(uint256(liquiditySeed), 10 ether, 1_000_000 ether);

        vm.prank(ALICE);
        router.addLiquidity(
            address(tokenA), address(tokenB),
            liquidity, liquidity, liquidity, liquidity, ALICE, DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = ZVQPair(pair).getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);

        uint256 amountIn = _bound(uint256(swapSeed), 1e12, liquidity / 5);
        address[] memory path = _path(address(tokenA), address(tokenB));
        uint256[] memory quoted = router.getAmountsOut(amountIn, path);

        vm.prank(ALICE);
        uint256[] memory actual = router.swapExactTokensForTokens(
            amountIn, quoted[1], path, ALICE, DEADLINE
        );
        require(actual[1] == quoted[1], "quote mismatch");

        (uint112 r0After, uint112 r1After,) = ZVQPair(pair).getReserves();
        require(uint256(r0After) * uint256(r1After) >= kBefore, "constant product decreased");
    }

    function testFuzzFailedSlippageIsAtomic(uint96 liquiditySeed, uint96 swapSeed) public {
        uint256 liquidity = _bound(uint256(liquiditySeed), 10 ether, 1_000_000 ether);

        vm.prank(ALICE);
        router.addLiquidity(
            address(tokenA), address(tokenB),
            liquidity, liquidity, liquidity, liquidity, ALICE, DEADLINE
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        (uint112 r0Before, uint112 r1Before,) = ZVQPair(pair).getReserves();
        uint256 aliceBefore = tokenA.balanceOf(ALICE);

        uint256 amountIn = _bound(uint256(swapSeed), 1e12, liquidity / 5);
        address[] memory path = _path(address(tokenA), address(tokenB));
        uint256[] memory quoted = router.getAmountsOut(amountIn, path);

        vm.prank(ALICE);
        (bool ok,) = address(router).call(
            abi.encodeWithSelector(
                router.swapExactTokensForTokens.selector,
                amountIn, quoted[1] + 1, path, ALICE, DEADLINE
            )
        );
        require(!ok, "slippage bypassed");

        (uint112 r0After, uint112 r1After,) = ZVQPair(pair).getReserves();
        require(r0After == r0Before && r1After == r1Before, "reserves changed");
        require(tokenA.balanceOf(ALICE) == aliceBefore, "input changed");
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
        uint256 amountIn2 = amountIn1 + _bound(uint256(deltaSeed), 1, 1e20);

        uint256 out1 = router.getAmountOut(amountIn1, reserveIn, reserveOut);
        uint256 out2 = router.getAmountOut(amountIn2, reserveIn, reserveOut);

        require(out2 >= out1, "non-monotonic output");
        require(out1 < reserveOut && out2 < reserveOut, "reserve exhausted");
    }

    function testFuzzNativeRefundAndWZVQBacking(uint96 initialSeed, uint96 topUpSeed) public {
        uint256 initial = _bound(uint256(initialSeed), 10 ether, 1_000 ether);
        uint256 topUp = _bound(uint256(topUpSeed), 1 ether, initial / 2);

        vm.prank(ALICE);
        router.addLiquidityZVQ{value: initial}(
            address(tokenA), initial, initial, initial, ALICE, DEADLINE
        );

        uint256 nativeBefore = ALICE.balance;
        vm.prank(ALICE);
        (uint256 amountToken, uint256 amountZVQ,) = router.addLiquidityZVQ{value: topUp * 2}(
            address(tokenA), topUp, 0, 0, ALICE, DEADLINE
        );

        require(amountToken == topUp && amountZVQ == topUp, "optimal ratio mismatch");
        require(nativeBefore - ALICE.balance == amountZVQ, "refund mismatch");
        require(address(router).balance == 0, "router retained ZVQ");
        require(address(wzvq).balance == wzvq.totalSupply(), "WZVQ backing mismatch");
    }

    function testPairReentrancyLockBlocksCallback() public {
        ReentrantTokenZVQ reentrant = new ReentrantTokenZVQ();
        reentrant.mint(ALICE, 1_000_000 ether);

        vm.prank(ALICE);
        reentrant.approve(address(router), type(uint256).max);

        vm.prank(ALICE);
        router.addLiquidity(
            address(reentrant), address(tokenB),
            10_000 ether, 10_000 ether,
            10_000 ether, 10_000 ether,
            ALICE, DEADLINE
        );

        address pair = factory.getPair(address(reentrant), address(tokenB));
        reentrant.setTargetPair(pair);
        reentrant.setEnabled(true);

        address[] memory path = _path(address(tokenB), address(reentrant));
        vm.prank(ALICE);
        uint256[] memory out = router.swapExactTokensForTokens(
            100 ether, 1, path, ALICE, DEADLINE
        );

        require(out[1] > 0, "outer swap failed");
        require(reentrant.attempted(), "reentry not attempted");
        require(!reentrant.succeeded(), "reentrancy lock bypassed");
    }
}
