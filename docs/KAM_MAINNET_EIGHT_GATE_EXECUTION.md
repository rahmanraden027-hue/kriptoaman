# KAM Network — Eight-Gate Mainnet Execution

Status: **MAINNET CANDIDATE — PROMOTION BLOCKED UNTIL ALL EIGHT GATES PASS**

This is an evidence policy, not a claim that unfinished work has passed. A checkbox, document, or healthy endpoint sample cannot replace retained operational evidence.

## Current verified boundary

- Canonical candidate Chain ID: `22028` (`0x560c`).
- Consensus profile: QBFT with four current validators.
- Four validators are the minimum operational set for tolerating one unavailable or Byzantine validator. Seven independently operated validators are the high-resilience target for tolerating two.
- The public status remains `mainnet-candidate-not-public`.
- KAM must be described as targeting crypto-agility and post-quantum migration readiness, not as quantum-proof.

## The eight gates

1. **Network identity freeze** — preserve Chain ID, genesis supply, consensus parameters and canonical endpoints through reviewed changes only.
2. **Validator fault tolerance** — prove distinct hosts/operators and continuous block production during a controlled validator outage.
3. **Load and soak** — run read-only staged load tests, 24-hour uninterrupted monitoring and a recommended 30-day soak window.
4. **Independent security review** — independently assess infrastructure, public RPC, contracts, application/authentication and supply chain; zero unresolved reachable Critical/High findings.
5. **Backup and recovery** — restore isolated nodes/indexers from encrypted backups and reconcile block/state evidence.
6. **RPC and observability** — isolate the origin, block sensitive namespaces, rate-limit expensive calls and retain alerts, latency and availability evidence.
7. **Post-quantum crypto-agility** — complete the cryptographic inventory; prototype and benchmark hybrid authorization on testnet before any activation proposal.
8. **Final rehearsal and governance** — execute rollback and incident drills, record approvers, and require a separate reviewed promotion commit.

## Immediate execution order

1. Repair public latency and repeat smoke probes from at least three independent networks.
2. Collect fresh signed/fingerprinted four-host evidence without committing hostnames, IPs, credentials or keys.
3. Prove dedicated RPC origin separation and firewall policy.
4. Start a new uninterrupted 24-hour hourly-evidence window; restart the window after any missing or failed hour.
5. Run controlled single-validator outage and restore drills on an approved maintenance window.
6. Run staged read-only load tests against isolated staging; stop at the first failed stage.
7. Commission independent infrastructure, application, smart-contract and cryptographic reviews.
8. Run the final go/no-go rehearsal. Only then may a reviewed status-change proposal be opened.

## Non-negotiable safety rules

- Never commit or transmit private keys, seed phrases, keystores, raw server credentials or recovery codes.
- Do not run destructive chaos testing on public production without an approved maintenance window and rollback owner.
- Do not change genesis, validator keys, treasury, supply or consensus merely to make a test pass.
- Do not mark a gate passed from documentation alone.
