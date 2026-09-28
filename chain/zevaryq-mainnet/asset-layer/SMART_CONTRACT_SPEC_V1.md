# ZEVARYQ Asset Layer — Smart Contract Specification v1

Status: **DRAFT FOR REVIEW — SOURCE ONLY**  
Network: ZEVARYQ Mainnet  
Chain ID: **22028 (0x560c)**

## 1. Purpose

This specification defines the first-party asset layer that may later support ZEVARYQ-native markets without impersonating third-party issuers.

The three proposed assets are:

| Asset | Name | Decimals | Economic meaning |
|---|---|---:|---|
| ZUSD | ZEVARYQ USD | 6 | reserve-backed USD-denominated ecosystem asset |
| zBTC | ZEVARYQ Bitcoin | 8 | representation of BTC locked outside ZEVARYQ |
| zETH | ZEVARYQ Ethereum | 18 | representation of ETH locked outside ZEVARYQ |

The design separates token accounting from custody, attestation, bridge execution, treasury, and DEX liquidity.

## 2. Explicit non-goals

v1 must not:

- create a token called USDT or USDC and imply issuer authorization;
- claim zBTC is native Bitcoin or zETH is native Ether;
- encode an artificial market price for ZVQ;
- allow an EOA owner to mint arbitrary supply;
- include transfer taxes, reflection mechanics, hidden fees, or stealth balance mutation;
- include arbitrary user blacklisting;
- embed DEX liquidity or treasury movement inside the token contracts;
- use an upgradeable proxy for token accounting;
- treat an off-chain attestation as cryptographic proof of real-world custody.

## 3. Common contract architecture

### 3.1 Token core

Each asset token core is immutable after deployment and exposes standard ERC-20 transfer/accounting behavior.

The token core may recognize controller contracts, but operational authority must be held by dedicated controller contracts governed by multisig/timelock policy rather than by a single externally owned account.

Required properties:

- deterministic decimals;
- no fee-on-transfer behavior;
- no rebasing;
- no arbitrary confiscation;
- no hidden mint method;
- mint/burn events are externally auditable;
- all administrative changes emit events.

### 3.2 Separation of authority

Recommended authorities:

- **Governance Safe** — changes controller addresses and policy parameters.
- **Reserve Controller** — manages ZUSD reserve attestations and mint allowance.
- **Bridge Controller** — validates zBTC/zETH deposit and redemption state.
- **Emergency Guardian** — may invoke narrowly scoped, time-bounded emergency controls.
- **Treasury Safe** — owns ecosystem liquidity assets but has no mint authority.

No one role should control both backing attestation and treasury liquidity.

### 3.3 Governance threshold

Initial policy recommendation:

- Routine reserve/bridge quorum: **3-of-5**.
- Controller/role replacement: **4-of-5 + 24-hour timelock**.
- Emergency pause activation: **4-of-5**.
- Emergency pause maximum duration per action: **24 hours**.
- Extension requires a new 4-of-5 authorization.

This is a policy target, not a claim that a Safe currently exists.

### 3.4 Emergency controls

Emergency controls must be scoped:

- `mintPaused`
- `redemptionPaused`
- `bridgeOpsPaused`

Ordinary user transfers SHOULD remain enabled during a bridge/custody incident unless a separately reviewed critical token exploit requires a temporary global pause.

If a global pause is implemented, it must be time-bounded and publicly observable.

## 4. ZUSD specification

### 4.1 Identity

- Name: **ZEVARYQ USD**
- Symbol: **ZUSD**
- Decimals: **6**
- Target unit: approximately 1 USD per ZUSD, subject to actual reserve/redemption operations.
- Supply: elastic; no fixed premine.

### 4.2 Backing model

ZUSD v1 is designed for **reserve-backed issuance**, not an algorithmic peg.

Normative invariant:

`postMintTotalSupply <= verifiedReserveUnits`

where `verifiedReserveUnits` uses 6-decimal USD units. If a later attestation reports reserve below outstanding supply, the deficit is recorded truthfully, user balances are not confiscated, and all further minting remains disabled until backing again covers supply.

An attestation may authorize a mint ceiling, but the contract cannot independently prove bank/custody assets. Reserve attestation therefore represents a governance/custody trust boundary and must be supported by real external evidence before production use.

### 4.3 Reserve attestation

Required state:

- `reserveEpoch: uint64`
- `verifiedReserveUnits: uint256`
- `attestationHash: bytes32`
- `attestedAt: uint64`
- `validUntil: uint64`

Required behavior:

- epochs increase monotonically;
- stale or expired attestations cannot authorize minting;
- an attestation hash cannot be reused for another epoch;
- minting cannot exceed the latest verified reserve ceiling;
- reserve reduction below outstanding supply immediately disables new minting and emits a deficit event.

Suggested events:

- `ReserveAttested(epoch, reserveUnits, attestationHash, validUntil)`
- `ReserveDeficit(epoch, reserveUnits, totalSupply)`
- `MintedAgainstReserve(to, amount, epoch)`

### 4.4 Mint

Mint must require:

1. caller is the Reserve Controller;
2. minting is not paused;
3. current reserve attestation is unexpired;
4. amount > 0;
5. `totalSupply + amount <= verifiedReserveUnits`.

There is no unrestricted `ownerMint`.

### 4.5 Redemption

Recommended v1 state machine:

`NONE -> REQUESTED -> SETTLED -> BURNED`

or

`REQUESTED -> CANCELLED`

At request time, ZUSD moves into a redemption escrow. It remains part of total supply until external settlement has been confirmed.

After reserve payout is confirmed, escrowed ZUSD is burned.

Cancellation before settlement returns escrowed ZUSD to the requester.

This preserves accounting integrity and avoids burning a user's asset before the redemption rail is committed.

Required fields per claim:

- `claimId`
- `requester`
- `amount`
- `destinationRefHash`
- `requestedAt`
- `state`

Never store bank-account or other sensitive destination data directly on-chain; use a commitment/reference hash.

## 5. zBTC specification

### 5.1 Identity

- Name: **ZEVARYQ Bitcoin**
- Symbol: **zBTC**
- Decimals: **8**
- Economic representation: 1 zBTC represents a claim against 1 BTC locked by the approved bridge/custody mechanism.
- No premine.

Normative backing target:

`postMintTotalSupply(zBTC) <= verifiedLockedBTC`

measured in satoshis. A later backing deficit may be reported without forced user-balance destruction; new minting must remain disabled while the deficit exists.

### 5.2 Deposit identifier

Each BTC deposit must map to a unique identifier such as:

`depositId = keccak256(targetChainId, bridgeController, assetId, sourceDomain, txid, vout)`

A `depositId` is permanently single-use.

State:

`UNSEEN -> ATTESTED -> MINTED`

The same BTC UTXO must never mint twice.

### 5.3 Mint

Mint requires:

- bridge operations not paused;
- deposit finality policy satisfied;
- attestation quorum reached;
- deposit identifier is computed canonically by the controller from source-domain + source-event fields and is unused;
- recipient nonzero;
- amount matches the attested source amount;
- resulting total supply does not exceed verified locked backing.

Suggested event:

`BridgeMinted(depositId, recipient, amount, proofHash)`

### 5.4 Redemption

Recommended state:

`NONE -> REQUESTED -> BURN_AUTHORIZED -> BURNED -> RELEASE_ATTESTED`\n\nor\n\n`REQUESTED -> CANCELLED`

A redemption request commits to a Bitcoin destination hash rather than storing raw destination metadata when possible.

Source BTC must not be released until the corresponding zBTC amount has been irreversibly burned or otherwise locked under the finalized bridge protocol.

Every redemption identifier is replay-protected.

## 6. zETH specification

### 6.1 Identity

- Name: **ZEVARYQ Ethereum**
- Symbol: **zETH**
- Decimals: **18**
- Economic representation: 1 zETH represents a claim against 1 ETH locked by the approved Ethereum bridge/custody mechanism.
- No premine.

Normative backing target:

`postMintTotalSupply(zETH) <= verifiedLockedETH`

measured in wei. A later backing deficit may be reported without forced user-balance destruction; new minting must remain disabled while the deficit exists.

### 6.2 Deposit identifier

Recommended deposit identifier:

`depositId = keccak256(sourceChainId, transactionHash, logIndex)`

State:

`UNSEEN -> ATTESTED -> MINTED`

The same source event cannot mint twice.

### 6.3 Mint and redemption

Mint and redemption use the same replay-protected state machine and controller separation as zBTC.

The bridge design may later evolve from quorum attestations to a stronger Ethereum proof/light-client mechanism without changing the zETH token identity, provided the migration is separately audited.

## 7. Bridge attestation model

For v1, zBTC/zETH may use a quorum-attested bridge controller if a trust-minimized bridge is not yet available.

Each attestation should commit to:

- asset identifier;
- source chain/network;
- source transaction/event identifier;
- source amount;
- ZEVARYQ recipient;
- observation/finality height;
- attestation epoch;
- proof/evidence hash.

Attestations must be domain-separated for Chain 22028 to prevent cross-chain replay.

A quorum-attestation bridge is not equivalent to trustless custody. Production UI and documentation must state the actual trust model.

## 8. Supply/backing invariants

Mandatory invariants:

### ZUSD
`totalSupply <= verifiedReserveUnits`

### zBTC
`totalSupply <= verifiedLockedBTC`

### zETH
`totalSupply <= verifiedLockedETH`

Additional invariants:

- a deposit identifier can mint at most once;
- a redemption identifier can settle at most once;
- a stale attestation cannot mint;
- minting while paused reverts;
- unauthorized minting reverts;
- controller replacement is timelocked;
- token core cannot be upgraded through delegatecall;
- ordinary token transfers do not depend on the bridge operator being online.

## 9. Price and liquidity separation

None of ZUSD, zBTC, or zETH contracts set the market price of ZVQ.

A future ZVQ/ZUSD pool will derive its initial price solely from the reserve ratio supplied to the DEX.

No liquidity transaction is authorized by this specification.

Proposed market hierarchy after backing is proven:

1. ZVQ/ZUSD — primary internal reference market.
2. ZVQ/zBTC.
3. ZVQ/zETH.
4. zBTC/ZUSD.
5. zETH/ZUSD.

## 10. Third-party issuer assets

USDC and USDT are not created by this specification.

A future asset such as `USDC.zvq` or `USDT.zvq` may only be integrated after all of the following are true:

- source token contract is identified;
- issuer/bridge provenance is documented;
- canonical bridge or custody path is established;
- mint/burn/redeem path is verifiable;
- UI clearly identifies the asset as bridged rather than issuer-native when appropriate.

Until then, ZUSD is the ZEVARYQ ecosystem stable-asset design.

## 11. Required test plan before implementation approval

### ZUSD
- reject unauthorized mint;
- reject mint above verified reserve;
- reject mint on expired attestation;
- accept new monotonic reserve epoch;
- reject replayed attestation hash;
- emit reserve deficit and disable minting when reserve falls below supply;
- redemption escrow accounting;
- cancellation restores escrow;
- settlement burns exactly once.

### zBTC / zETH
- reject duplicate deposit ID;
- reject unauthorized bridge mint;
- reject stale bridge epoch;
- reject amount mismatch;
- reject mint above verified locked backing;
- burn/release state transition exactly once;
- reject redemption replay;
- pause only affects scoped operations.

### Common
- no transfer fee;
- no blacklist;
- no rebase;
- no proxy/delegatecall;
- decimals immutable;
- governance changes obey threshold/timelock integration;
- invariant fuzzing for supply/backing and replay protection.

## 12. Production gates

All remain false until independently satisfied:

`ZUSD_IMPLEMENTATION_REVIEWED = false`  
`ZBTC_IMPLEMENTATION_REVIEWED = false`  
`ZETH_IMPLEMENTATION_REVIEWED = false`  
`RESERVE_CUSTODY_PROVEN = false`  
`BTC_BRIDGE_BACKING_PROVEN = false`  
`ETH_BRIDGE_BACKING_PROVEN = false`  
`ASSET_LAYER_AUDIT_COMPLETE = false`  
`ASSET_LAYER_DEPLOYMENT_AUTHORIZED = false`  
`LIQUIDITY_AUTHORIZED = false`  
`PUBLIC_TRADING_AUTHORIZED = false`
