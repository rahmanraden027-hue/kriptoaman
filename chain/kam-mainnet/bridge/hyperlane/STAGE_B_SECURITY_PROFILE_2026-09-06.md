# KAM ↔ Base USDC — Stage B Security Profile

Date: 2026-09-06
Status: **SECURITY DESIGN REVIEW — HOLD DEPLOYMENT / NO TREASURY MOVEMENT**

## Executive decision

Base native Circle-issued USDC remains the preferred source asset for a future KAM Mainnet quote-asset pilot. Hyperlane remains a candidate transport layer, but a stock `HypERC20Collateral -> HypERC20` route must **not** be treated as automatically compliant with Circle's Bridged USDC Standard.

If KriptoAman wants a future bridge-to-native-compatible USDC path, the destination token architecture must be based on Circle's FiatToken/FiatTokenProxy model and the bridge adapter must satisfy Circle's pause, burn-locked-USDC and role-transfer requirements. A plain Hyperlane synthetic token is therefore not approved as the production destination token for that objective.

No bridge contract, token, route, liquidity pool or treasury movement is authorized by this document.

## Toolchain freeze candidate

Current upstream references reviewed on 2026-09-06:

- Hyperlane CLI: `@hyperlane-xyz/cli` **44.0.2**
- Hyperlane Solidity package version exposed by `PackageVersioned.sol`: **12.1.0**
- Hyperlane CLI runtime requirement: Node.js **>=22**

Before any signed deployment, these exact versions/commits must be re-checked against current upstream security advisories and release notes and then pinned by commit/package integrity hash in the deployment record.

## Circle-standard compatibility finding

Circle's Bridged USDC Standard requires, among other items:

1. bridge-side ability to pause USDC bridging;
2. source bridge ability to burn locked USDC during a coordinated bridge-to-native upgrade;
3. destination token code/proxy compatible with Circle's FiatToken model;
4. all one-time initialization functions executed safely;
5. bridge/token roles structured so they can later be transferred to Circle;
6. removal of configured minters as part of a future role-transfer process;
7. source collateral reconciled to destination bridged supply before any upgrade.

Therefore the preferred architecture is:

`Base native USDC -> reviewed collateral custody adapter -> Hyperlane Mailbox/ISM transport -> Circle-compatible bridge minter adapter -> FiatTokenProxy bridged representation on KAM Mainnet`

This requires custom integration review; it is not equivalent to deploying the stock Hyperlane `HypERC20` synthetic token.

## Naming rule

Until Circle independently supports Chain ID 22028:

- never describe the destination asset as native Circle-issued USDC;
- use a clearly bridged name;
- use `USDC.e` only after the deployed design is demonstrated to follow the relevant Circle Bridged USDC Standard requirements;
- otherwise use an unambiguous project-specific bridged identifier and disclose that it is a third-party representation backed by locked Base USDC.

## Proposed security model for the pilot

### Ownership/admin

Production bridge ownership must not depend on one EOA.

Required before deployment:

- multisig-controlled owner/admin on Base;
- multisig-controlled owner/admin on KAM Mainnet;
- ProxyAdmin/upgrade authority separated from routine relayer keys;
- pauser/emergency role documented;
- token role holders documented: owner, masterMinter, pauser, blacklister and proxy administrator as applicable;
- deployer key loses unnecessary privileges after configuration is verified;
- no seed phrase/private key in GitHub, chat, screenshots, CI or support tickets.

Candidate pilot governance target: **2-of-3 multisig**, with signers on separate devices/custody paths. Final addresses must be recorded before signing any deployment.

### ISM / validator model

For a controlled pilot, use a **2-of-3 Multisig ISM** rather than a 1-of-1 validator.

Requirements:

- three distinct validator identities;
- validator signing keys stored using KMS/HSM-grade custody rather than plaintext hot keys for production;
- separate validator processes for each origin chain being validated;
- validator infrastructure separated across failure domains where practical;
- finality/confirmation settings documented per chain;
- at least one validator/operator should be operationally independent before public production use, or the route must explicitly disclose that the security set is project-operated.

The route trust assumption must be published: two validator signatures can authorize a bridge message.

### Relayer model

- one project relayer may be operated for liveness;
- relayer signing key is separate from bridge admin and validator keys;
- relayer holds only minimal gas balances;
- message delivery remains observable and recoverable because Hyperlane delivery is not intended to depend on a unique privileged relayer;
- alert on delayed/failed messages and repeated processing attempts.

## Accounting invariants

The deployment is not eligible for treasury use unless automated checks prove:

1. **At quiescence:** `destination bridged totalSupply == source USDC collateral locked for this route`.
2. During in-flight transfers, any temporary difference must equal explicitly identified pending messages and must converge after settlement.
3. Destination minting can occur only after a valid Hyperlane message passes the configured ISM.
4. Destination burn must precede or atomically authorize source collateral release for the return path.
5. No admin/relayer key can independently mint unbacked destination tokens.
6. Collateral withdrawal cannot bypass corresponding destination burn accounting.

Any unexplained positive destination-supply-minus-collateral delta is a **STOP/PAUSE** condition.

## Pilot limits

Before treasury authorization, define hard on-chain or operational caps for:

- maximum single bridge transfer;
- maximum outstanding bridged supply;
- daily aggregate bridge amount;
- emergency pause threshold.

The first round-trip must use only a tiny reversible amount. This document does not authorize a numerical treasury amount.

## Open security concern requiring closure

As of this review, Hyperlane GitHub issue `#8589` is open and contains an **unverified public allegation** of a critical issue affecting `HypERC20Collateral` / `HypNative` in an ERC4626-related scenario. No maintainer-confirmed advisory or technical disclosure was available in the reviewed public issue.

KriptoAman must not treat the allegation as confirmed, but it must treat it as a review blocker for blindly deploying affected stock components. Before production deployment, one of the following is required:

- a maintainer/public advisory demonstrating the relevant deployment path is not affected or is fixed; or
- independent source review of the exact pinned collateral implementation and its interaction with plain ERC20 Base USDC; and
- tests covering deposit, withdrawal, transferRemote, replay protection, pause/recovery and collateral/supply invariants.

## Stage B gate result

- Source Base USDC provenance: **PASS**
- KAM RPC primitives: **PASS**
- Toolchain versions identified: **PASS, re-check at deployment time**
- Stock Hyperlane synthetic as Circle-standard destination token: **NOT APPROVED**
- Circle-compatible destination token/adapter design: **PENDING**
- Multisig owner addresses: **PENDING**
- Validator identities/KMS configuration: **PENDING**
- Relayer configuration: **PENDING**
- Independent exact-contract security review: **PENDING**
- Bridge accounting test suite: **PENDING**
- Treasury movement: **NOT AUTHORIZED**
- DEX liquidity: **NOT AUTHORIZED**

## Next executable work

1. prepare KAM Hyperlane chain metadata locally;
2. design/review the Circle-compatible FiatToken bridge-minter adapter instead of stock `HypERC20` for the standard-compliant path;
3. pin exact upstream commits and produce bytecode hashes;
4. implement read-only/unit/fork tests for lock/mint and burn/release invariants;
5. define multisig, validator and relayer public addresses without exposing secrets;
6. run all tests before requesting any wallet signature.
