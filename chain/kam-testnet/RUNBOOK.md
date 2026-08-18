# KAM Testnet v1 — Operator Runbook

This runbook creates a four-validator Hyperledger Besu QBFT testnet for KAM. It is testnet-only and must not be used with production user funds.

## Pinned client

Use Besu `26.7.1` for this testnet baseline. Pin the exact image/tag in deployment automation; do not use `latest` in production-like environments.

## Consensus

- QBFT proof-of-authority
- 4 validators minimum
- Chain ID: `22027` (`0x560b`)
- Block period: 3 seconds
- Request timeout: 6 seconds
- Epoch length: 30000
- Native asset: KAM, 18 decimals
- Working genesis allocation: 1,000,000,000 KAM to a dedicated TESTNET treasury address

## 1. Prepare isolated host

Install Docker Engine and Docker Compose on a dedicated test host/VPS. Do not use a machine that holds production wallet keys.

Create directories outside the repository for secrets and chain data:

```bash
mkdir -p "$HOME/kam-testnet-secrets" "$HOME/kam-testnet-data"
chmod 700 "$HOME/kam-testnet-secrets"
```

## 2. Generate four validator keys

Generate validator node keys with Besu on the operator host. Never commit the private keys. Export the four validator addresses and sort them in ascending order before generating QBFT `extraData`.

Besu's QBFT flow requires the validator addresses in the genesis `extraData`. The repository intentionally contains only a template and no validator secrets.

Expected secret layout after generation:

```text
$HOME/kam-testnet-secrets/
  validator1/key
  validator1/key.pub
  validator2/key
  validator2/key.pub
  validator3/key
  validator3/key.pub
  validator4/key
  validator4/key.pub
```

## 3. Create QBFT extraData

Create a JSON file containing the four validator addresses in ascending order, then use Besu's QBFT RLP encoder:

```bash
besu rlp encode --from=toEncode.json --type=QBFT_EXTRA_DATA
```

Copy the resulting RLP value into `extraData` in a local copy of `qbft-genesis.template.json`.

## 4. Set the testnet treasury

Generate a dedicated TESTNET treasury address. Replace `REPLACE_WITH_TESTNET_TREASURY_ADDRESS_WITHOUT_0x` in the local genesis file with the address without the `0x` prefix.

The provided balance equals `1,000,000,000 KAM × 10^18` base units.

Do not use an exchange deposit address, personal mainnet treasury, or any wallet containing real assets.

## 5. Start validators

Start all four validators with the exact same genesis file. Each validator must use its own node key and data path.

Recommended RPC exposure model:

- validator nodes: RPC bound to private/internal network only
- one dedicated RPC node or gateway for external test access
- TLS at the reverse proxy
- IP/rate limiting before public exposure
- only required JSON-RPC namespaces enabled

At minimum for health testing, enable `ETH`, `NET`, and `WEB3`. Enable `QBFT` only on a protected administration endpoint when validator voting is required.

## 6. Verify consensus and RPC

Set the RPC URL and run:

```bash
./check-rpc.sh https://your-testnet-rpc.example
```

The script must pass Chain ID `0x560b` and return a current block number/client version.

Then verify:

```text
- all 4 validators are participating
- blocks continue advancing
- peer count is stable
- no repeated QBFT round changes
- test treasury balance equals expected genesis allocation
```

## 7. First KAM test transfer

Import only a dedicated test account into an EVM-compatible wallet or use an offline signing tool. Add KriptoAman Testnet manually:

```text
Network name: KriptoAman Testnet
RPC URL: <your testnet RPC>
Chain ID: 22027
Currency symbol: KAM
Explorer: <add after explorer deployment>
```

Transfer a small amount of TEST KAM between two test-only accounts. Record transaction hash and block number in the deployment log.

## 8. Promotion gate

Do not call this network mainnet until all of the following are complete:

- independent security review
- validator redundancy across separate hosts/providers
- secret management/HSM or equivalent production-grade key protection
- monitoring and incident response
- backup/recovery exercise
- finalized token economics and governance
- legal/regulatory review for any public distribution or trading
- no conflict with KriptoAman Google Play watch-only positioning

## Failure rule

If more than one validator becomes unavailable in this four-validator topology, stop any promotion work and restore validator health before continuing. QBFT safety/liveness depends on retaining the required super-majority.
