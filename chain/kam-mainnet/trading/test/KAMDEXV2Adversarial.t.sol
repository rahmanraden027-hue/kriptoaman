// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMPairV2.sol";
import "../dex-v2/KAMRouterV2.sol";
import "./MockToken.sol";

contract FeeOnTransferTokenV2Test {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "FEE: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "FEE: BALANCE");
        uint256 fee = amount / 100;
        uint256 received = amount - fee;
        balanceOf[from] -= amount;
        balanceOf[to] += received;
        totalSupply -= fee;
    }
}

/// @dev Same transfer selectors as ERC-20, but deliberately returns no data.
contract NoReturnTokenV2Test {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external {
        _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "NORETURN: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "NORETURN: BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

contract ReentrantTransferFromTokenV2Test {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    KAMFactoryV2 public factory;
    address public peerToken;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    function configure(KAMFactoryV2 _factory, address _peerToken) external {
        factory = _factory;
        peerToken = _peerToken;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (!reentryAttempted && address(factory) != address(0)) {
            reentryAttempted = true;
            (reentrySucceeded,) = address(factory).call(
                abi.encodeWithSelector(
                    factory.createPairAndSeed.selector,
                    address(this),
                    peerToken,
                    uint256(1),
                    uint256(1),
                    from
                )
            );
        }

        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "REENTER: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "REENTER: BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

contract PairCallbackTokenV2Test {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public targetPair;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    function configurePair(address pair) external {
        targetPair = pair;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (msg.sender == targetPair && !callbackAttempted) {
            callbackAttempted = true;
            (callbackSucceeded,) = targetPair.call(abi.encodeWithSelector(KAMPairV2.mint.selector, address(this)));
        }
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "CALLBACK: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "CALLBACK: BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

contract KAMDEXV2AdversarialTest {
    KAMFactoryV2 factory;
    KAMRouterV2 router;
    WKAM wkam;
    MockToken tokenA;
    MockToken tokenB;

    function setUp() public {
        wkam = new WKAM();
        factory = new KAMFactoryV2(address(this));
        router = new KAMRouterV2(address(factory), address(wkam));
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        tokenA.mint(address(this), 2_000_000 ether);
        tokenB.mint(address(this), 2_000_000 ether);
        tokenA.approve(address(factory), type(uint256).max);
        tokenB.approve(address(factory), type(uint256).max);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
    }

    function testFeeOnTransferInitialSeedFailsClosedAndRollsBackPair() public {
        FeeOnTransferTokenV2Test feeToken = new FeeOnTransferTokenV2Test();
        feeToken.mint(address(this), 100_000 ether);
        feeToken.approve(address(factory), type(uint256).max);

        uint256 feeBefore = feeToken.balanceOf(address(this));
        uint256 goodBefore = tokenA.balanceOf(address(this));

        (bool ok,) = address(factory).call(
            abi.encodeWithSelector(
                factory.createPairAndSeed.selector,
                address(feeToken),
                address(tokenA),
                10_000 ether,
                10_000 ether,
                address(this)
            )
        );

        require(!ok, "fee-on-transfer seed unexpectedly accepted");
        require(factory.allPairsLength() == 0, "pair survived rejected seed");
        require(feeToken.balanceOf(address(this)) == feeBefore, "fee token state did not roll back");
        require(tokenA.balanceOf(address(this)) == goodBefore, "peer token state did not roll back");
    }

    function testNoReturnTokenInitialSeedFailsClosedAndRollsBackPair() public {
        NoReturnTokenV2Test noReturn = new NoReturnTokenV2Test();
        noReturn.mint(address(this), 100_000 ether);
        noReturn.approve(address(factory), type(uint256).max);

        uint256 specialBefore = noReturn.balanceOf(address(this));
        uint256 goodBefore = tokenA.balanceOf(address(this));

        (bool ok,) = address(factory).call(
            abi.encodeWithSelector(
                factory.createPairAndSeed.selector,
                address(noReturn),
                address(tokenA),
                10_000 ether,
                10_000 ether,
                address(this)
            )
        );

        require(!ok, "no-return token seed unexpectedly accepted");
        require(factory.allPairsLength() == 0, "pair survived no-return rejection");
        require(noReturn.balanceOf(address(this)) == specialBefore, "no-return token state did not roll back");
        require(tokenA.balanceOf(address(this)) == goodBefore, "peer token state did not roll back");
    }

    function testFactoryLockBlocksTransferFromReentryDuringAtomicSeed() public {
        ReentrantTransferFromTokenV2Test reentrant = new ReentrantTransferFromTokenV2Test();
        reentrant.mint(address(this), 100_000 ether);
        reentrant.approve(address(factory), type(uint256).max);
        reentrant.configure(factory, address(tokenA));

        (address pair, uint256 liquidity) = factory.createPairAndSeed(
            address(reentrant), address(tokenA), 10_000 ether, 10_000 ether, address(this)
        );

        require(pair != address(0) && liquidity > 0, "outer seed failed");
        require(reentrant.reentryAttempted(), "reentry not attempted");
        require(!reentrant.reentrySucceeded(), "factory reentry succeeded");
        require(factory.allPairsLength() == 1, "unexpected pair count after blocked reentry");
    }

    function testPairLockBlocksTokenCallbackReentryDuringSwap() public {
        PairCallbackTokenV2Test callbackToken = new PairCallbackTokenV2Test();
        callbackToken.mint(address(this), 500_000 ether);
        callbackToken.approve(address(factory), type(uint256).max);

        (address pair,) = factory.createPairAndSeed(
            address(callbackToken), address(tokenA), 100_000 ether, 100_000 ether, address(this)
        );
        callbackToken.configurePair(pair);

        uint256 callbackBefore = callbackToken.balanceOf(address(this));
        uint256 out = router.swapExactTokensForTokens(
            1_000 ether,
            1,
            address(tokenA),
            address(callbackToken),
            address(this),
            type(uint256).max
        );

        require(out > 0, "swap produced no output");
        require(callbackToken.balanceOf(address(this)) == callbackBefore + out, "callback output mismatch");
        require(callbackToken.callbackAttempted(), "pair callback reentry not attempted");
        require(!callbackToken.callbackSucceeded(), "pair reentry succeeded");
    }

    function testFuzzSwapDoesNotDecreaseConstantProduct(uint96 rawAmountIn) public {
        (address pair,) = factory.createPairAndSeed(
            address(tokenA), address(tokenB), 100_000 ether, 100_000 ether, address(this)
        );

        uint256 amountIn = 1 ether + (uint256(rawAmountIn) % (5_000 ether));
        (uint112 reserve0Before, uint112 reserve1Before,) = KAMPairV2(pair).getReserves();
        uint256 kBefore = uint256(reserve0Before) * uint256(reserve1Before);

        uint256 out = router.swapExactTokensForTokens(
            amountIn,
            1,
            address(tokenA),
            address(tokenB),
            address(this),
            type(uint256).max
        );
        require(out > 0, "fuzz swap produced no output");

        (uint112 reserve0After, uint112 reserve1After,) = KAMPairV2(pair).getReserves();
        uint256 kAfter = uint256(reserve0After) * uint256(reserve1After);
        require(kAfter >= kBefore, "constant product decreased");
    }

    function testDirectPublicMintCannotRunBeforeFactorySeed() public {
        KAMPairV2 pair = new KAMPairV2();
        pair.initialize(address(tokenA), address(tokenB));
        tokenA.transfer(address(pair), 1_000 ether);
        tokenB.transfer(address(pair), 1_000 ether);

        (bool ok,) = address(pair).call(abi.encodeWithSelector(pair.mint.selector, address(this)));
        require(!ok, "public mint succeeded before initial seed");
        require(pair.totalSupply() == 0, "LP supply created before seed");
    }
}
