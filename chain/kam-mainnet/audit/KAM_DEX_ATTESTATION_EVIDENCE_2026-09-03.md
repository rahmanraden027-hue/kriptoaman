# KAM DEX Runtime Attestation Evidence — 2026-09-03

Status: **PASS — READ-ONLY SOURCE/RUNTIME GATE**

This evidence records the successful mixed-compiler runtime attestation for the KAM DEX audit branch. It does not authorize pair creation, treasury movement, liquidity seeding, or public Swap activation.

## Workflow evidence

- Workflow: `KAM DEX Runtime Attestation`
- GitHub Actions run ID: `33732993736`
- Job ID: `100576998125`
- Conclusion: `success`
- Evidence artifact: `kam-dex-runtime-attestation-33732993736`
- Artifact ID: `9884604618`
- Artifact ZIP SHA-256: `d881afe652cf10f1dd252fdeaa4b6efdc3f784ab7e8c16eb4490bc22be037a2c`
- Attestation generated at: `2026-09-03T08:22:44.692Z`
- Observed chain ID: `22028`
- Observed block number: `403152`
- Mode: `READ_ONLY_MIXED_COMPILER_SOURCE_RUNTIME_ATTESTATION`

The workflow asserted before and after the attestation that `DEPLOYER_PRIVATE_KEY` and `MNEMONIC` were absent.

## Compiler evidence

### WKAM

- Compiler: `0.8.24+commit.e11b9ed9.Emscripten.clang`
- Optimizer: enabled, 200 runs
- EVM: Paris
- Compiled/on-chain runtime: `2232` bytes
- Exact runtime match: `true`
- Logic runtime match: `true`
- Runtime SHA-256: `739d764da5216881769312e6b80f5bbe856b9ded889635a51ac0935e90717c30`
- Logic SHA-256: `464d7acacb04d95fc5544cfbc6ba8c6053a551470e9f0df743550335a456140f`

### KAMFactory

- Compiler metadata: `0.8.36`
- Optimizer: enabled, 200 runs
- EVM: Paris
- Compiled/on-chain runtime: `7609` bytes
- Exact normalized runtime match: `true`
- Logic runtime match: `true`
- Runtime SHA-256: `a046af379249f2d5f72ef823837d1c661cc755359c54e09ef0274d8d2ad02237`
- Logic SHA-256: `145d1f6093ac351b909048a6cd346d4bfe87f2cec1ce49797a749f73b3b4c1be`

### KAMRouter

- Compiler metadata: `0.8.36`
- Optimizer: enabled, 200 runs
- EVM: Paris
- Compiled/on-chain runtime: `8456` bytes
- Immutable slots normalized: `24`
- Exact normalized runtime match: `true`
- Logic runtime match: `true`
- Runtime SHA-256 after immutable normalization: `9095f45d066f83e677ef68a4ac511dc64b89a2c8742e6d1bcaa4c09e5c0a997b`
- Logic SHA-256: `8d4e140bb21e7babbf7326f10d29dc6495c0c7a1ac3a98b27bd8111c650d7503`

## Binding/state evidence

- Router `factory()` = `0x5024017B0496113269E80817d9b0F11733AE6de2`
- Expected Factory = same
- Router Factory binding match: `true`
- Router `WKAM()` = `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Expected WKAM = same
- Router WKAM binding match: `true`
- Factory `allPairsLength()` = `0`
- `noPairsYet` = `true`

## Deployment receipt evidence

### WKAM

- Tx: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`
- Block: `240024`
- Status: `1`
- Contract address matched: `true`

### Factory

- Tx: `0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedeb5c0e4`
- Block: `384625`
- Status: `1`
- Contract address matched: `true`

### Router

- Tx: `0x83dd3be8629483b2db730c86437128fb39f8b7ceb0738e970bba9c7a9bf98053`
- Block: `384625`
- Status: `1`
- Contract address matched: `true`

## Attestation checks

All runtime-attestation checks returned `true`:

- chain ID
- current height at or beyond recorded deployments
- runtime code present
- exact source/runtime matches
- logic runtime matches ignoring metadata
- compiler versions/metadata
- Router bindings
- no pairs yet
- deployment receipts found
- deployment receipts succeeded
- receipt contract addresses
- receipt deployment blocks

Final attestation field: `ready = true`.

## Gate interpretation

This closes the internal **source/runtime identity gate**. It does **not** close the independent smart-contract review gate. Production liquidity remains on HOLD until an independent reviewer assesses the frozen source scope and the remaining launch-integrity and contract findings in `KAM_DEX_AUDIT_HANDOFF_2026-09-03.md`.
