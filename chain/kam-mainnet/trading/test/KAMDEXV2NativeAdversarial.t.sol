// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/WKAM.sol";
import "../dex-v2/KAMFactoryV2.sol";
import "../dex-v2/KAMPairV2.sol";
import "../dex-v2/KAMRouterV2.sol";
import "./MockToken.sol";

interface VmNativeV2 {
    function deal(address who, uint256 newBalance) external;
}

contract WKAMReentrantWithdrawReceiverV2Test {
    WKAM public immutable wkam;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    constructor(WKAM _wkam) {
        wkam = _wkam;
    }

    function depositAndWithdraw() external payable {
        require(msg.value > 0, "receiver: zero value");
        wkam.deposit{value: msg.value}();
        wkam.withdraw(msg.value);
    }

    receive() external payable {
        if (!callbackAttempted) {
            callbackAttempted = true;
            (callbackSucceeded,) = address(wkam).call(abi.encodeWithSelector(wkam.withdraw.selector, msg.value));
        }
    }
}

contract RouterNativeRecipientV2Test {
    KAMRouterV2 public router;
    address public tokenOut;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    function configure(KAMRouterV2 _router, address _tokenOut) external {
        router = _router;
        tokenOut = _tokenOut;
    }

    receive() external payable {
        if (!callbackAttempted && address(router) != address(0)) {
            callbackAttempted = true;
            (callbackSucceeded,) = address(router).call(
                abi.encodeWithSelector(
                    router.swapExactKAMForTokens.selector,
                    uint256(1),
                    tokenOut,
                    address(this),
                    type(uint256).max
                )
            );
        }
    }
}

contract RouterRefundReentrantCallerV2Test {
    KAMRouterV2 public immutable router;
    MockToken public immutable token;
    bool public callbackAttempted;
    bool public callbackSucceeded;

    constructor(KAMRouterV2 _router, MockToken _token) {
        router = _router;
        token = _token;
    }

    function addWithRefund(uint256 tokenDesired) external payable returns (uint256 amountToken, uint256 amountKAM, uint256 liquidity) {
        token.approve(address(router), type(uint256).max);
        return router.addLiquidityKAM{value: msg.value}(
            address(token), tokenDesired, 1, 1, address(this), type(uint256).max
        );
    }

    receive() external payable {
        if (!callbackAttempted) {
            callbackAttempted = true;
            (callbackSucceeded,) = address(router).call(
                abi.encodeWithSelector(
                    router.swapExactKAMForTokens.selector,
                    uint256(1),
                    address(token),
                    address(this),
                    type(uint256).max
                )
            );
        }
    }
}

contract KAMDEXV2NativeAdversarialTest {
    VmNativeV2 internal constant vm = VmNativeV2(address(uint160(uint256(keccak256("hevm cheat code")))));

    WKAM internal wkam;
    KAMFactoryV2 internal factory;
    KAMRouterV2 internal router;
    KAMPairV2 internal pair;
    MockToken internal token;

    function setUp() public {
        vm.deal(address(this), 1_000 ether);

        wkam = new WKAM();
        factory = new KAMFactoryV2(address(this));
        router = new KAMRouterV2(address(factory), address(wkam));
        token = new MockToken("Native Pair Token", "NPT");

        token.mint(address(this), 1_000_000 ether);
        token.approve(address(factory), type(uint256).max);
        token.approve(address(router), type(uint256).max);

        wkam.deposit{value: 100 ether}();
        wkam.approve(address(factory), type(uint256).max);

        (address pairAddress,) = factory.createPairAndSeed(
            address(wkam), address(token), 100 ether, 100 ether, address(this)
        );
        pair = KAMPairV2(pairAddress);
    }

    function testWKAMWithdrawCallbackCannotDoubleWithdraw() public {
        WKAMReentrantWithdrawReceiverV2Test receiver = new WKAMReentrantWithdrawReceiverV2Test(wkam);

        uint256 supplyBefore = wkam.totalSupply();
        uint256 reserveBefore = address(wkam).balance;

        receiver.depositAndWithdraw{value: 1 ether}();

        require(receiver.callbackAttempted(), "WKAM callback not attempted");
        require(!receiver.callbackSucceeded(), "WKAM reentrant withdraw succeeded");
        require(wkam.balanceOf(address(receiver)) == 0, "receiver retains WKAM unexpectedly");
        require(address(receiver).balance == 1 ether, "native KAM return mismatch");
        require(wkam.totalSupply() == supplyBefore, "WKAM supply changed after round trip");
        require(address(wkam).balance == reserveBefore, "WKAM reserve changed after round trip");
    }

    function testSwapTokensForKAMRecipientCallbackCannotReenterRouter() public {
        RouterNativeRecipientV2Test receiver = new RouterNativeRecipientV2Test();
        receiver.configure(router, address(token));

        uint256 amountOut = router.swapExactTokensForKAM(
            1 ether, 1, address(token), address(receiver), type(uint256).max
        );

        require(amountOut > 0, "no KAM output");
        require(address(receiver).balance == amountOut, "recipient KAM mismatch");
        require(receiver.callbackAttempted(), "recipient callback not attempted");
        require(!receiver.callbackSucceeded(), "router reentry succeeded during KAM output");
        require(address(router).balance == 0, "router retained native KAM");
    }

    function testRemoveLiquidityKAMRecipientCallbackCannotReenterRouter() public {
        RouterNativeRecipientV2Test receiver = new RouterNativeRecipientV2Test();
        receiver.configure(router, address(token));

        uint256 liquidity = pair.balanceOf(address(this)) / 10;
        pair.approve(address(router), liquidity);

        (uint256 amountToken, uint256 amountKAM) = router.removeLiquidityKAM(
            address(token), liquidity, 1, 1, address(receiver), type(uint256).max
        );

        require(amountToken > 0 && amountKAM > 0, "remove liquidity returned zero");
        require(token.balanceOf(address(receiver)) == amountToken, "recipient token mismatch");
        require(address(receiver).balance == amountKAM, "recipient KAM mismatch");
        require(receiver.callbackAttempted(), "remove callback not attempted");
        require(!receiver.callbackSucceeded(), "router reentry succeeded during remove");
        require(address(router).balance == 0, "router retained native after remove");
    }

    function testAddLiquidityKAMRefundCallbackCannotReenterRouter() public {
        RouterRefundReentrantCallerV2Test caller = new RouterRefundReentrantCallerV2Test(router, token);
        token.transfer(address(caller), 10 ether);

        (uint256 amountToken, uint256 amountKAM, uint256 liquidity) = caller.addWithRefund{value: 2 ether}(1 ether);

        require(amountToken == 1 ether, "unexpected token amount");
        require(amountKAM == 1 ether, "unexpected KAM amount");
        require(liquidity > 0, "no liquidity minted");
        require(address(caller).balance == 1 ether, "refund mismatch");
        require(caller.callbackAttempted(), "refund callback not attempted");
        require(!caller.callbackSucceeded(), "router reentry succeeded during refund");
    }

    function testRouterRejectsDirectNativeKAMFromNonWKAMSender() public {
        uint256 beforeBalance = address(this).balance;
        (bool ok,) = address(router).call{value: 1 ether}("");
        require(!ok, "router accepted direct native KAM");
        require(address(router).balance == 0, "router retained rejected KAM");
        require(address(this).balance == beforeBalance, "failed send did not roll back value");
    }
}
