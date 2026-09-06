# KriptoAman Zero-Trust & Post-Quantum Security Baseline — 2026

Status: **SECURITY HARDENING BASELINE — DEFENSE IN DEPTH**

This document defines the minimum security posture for KriptoAman, KAM Network, public APIs, wallets, build pipelines, servers, and long-lived sensitive data.

## Security statement

No internet-connected system can be truthfully guaranteed to be permanently free from hacking, software errors, operator mistakes, hardware faults, or future cryptanalytic breakthroughs. KriptoAman therefore uses a defense-in-depth model: prevent, isolate, detect, recover, verify, and continuously improve.

KriptoAman must not claim that KAM Network, EVM accounts, Solana accounts, or existing wallet signatures are post-quantum safe unless a reviewed post-quantum protocol is actually deployed and independently assessed.

## Immediate production rules

1. **No private-key custody by the public platform.** Public production wallet surfaces must prefer external wallets/hardware wallets and must not expose transaction signing unless an explicitly reviewed release gate enables it.
2. **Experimental browser-local mnemonic creation is not a production feature.** Any local self-custody implementation must remain disabled by default in production until an independent wallet-security assessment is complete.
3. **No secrets in source control.** Private keys, seed phrases, signing keystores, `.env` files, API secrets, recovery codes, and credentials must never be committed.
4. **Least privilege.** Production credentials, GitHub Actions permissions, database bindings, admin endpoints, VPS users, and deployment runners receive only the privileges required for their task.
5. **Strong authentication.** Administrative access must use MFA/passkeys where supported. Password login must use salted slow password hashing and constant-time verification.
6. **Fail closed for writes.** Cross-origin state-changing requests, unverified transaction execution, unsafe chain promotion, and DEX deployment must remain blocked unless their security gates pass.
7. **Recovery is a security control.** Backups must be encrypted, restorable, separated from production credentials, and periodically tested.

## Application and API controls

- HTTPS/HSTS on public origins.
- Content Security Policy with no `unsafe-eval`.
- Anti-framing controls and restrictive Permissions Policy.
- CSRF/cross-origin write protection for API mutations.
- Input validation and bounded request sizes on sensitive endpoints.
- Rate limiting / abuse controls for authentication, password reset, OTP, KYC initiation, public RPC and expensive APIs.
- Session cookies: `Secure`, `HttpOnly`, appropriate `SameSite`, short-lived sessions, revocation on password reset and security events.
- Audit logs for admin/security actions without logging passwords, seeds, tokens or full sensitive payloads.
- Dependency, CodeQL, secret/private-key and production-build checks on every release path.

## Wallet and treasury controls

- Public production interface is non-custodial and external-wallet first.
- Hardware wallet or multisig is preferred for treasury and privileged signing.
- Seed phrases/private keys must never be sent to KriptoAman servers, analytics, logs, email, chat, or support tickets.
- Browser `localStorage` is not an approved production location for newly generated treasury/private keys.
- DEX treasury/liquidity actions remain under controlled release gates and independent review.
- High-value treasury movement should use separation of duties, transaction simulation, human-readable intent verification, allowlists where appropriate, and delayed/canary execution.

## Server / VPS controls

Required for each production VPS and dedicated runner:

- SSH public-key authentication only; password/root remote login disabled where operationally feasible.
- Separate non-root operator accounts and minimal `sudo`.
- Host firewall default deny; expose only explicitly required ports.
- Validator P2P, admin APIs, Docker socket, database ports and internal RPC origins are never directly exposed to the public internet unless required and separately protected.
- Automatic security updates or a controlled patch SLA.
- Brute-force protection and SSH/auth anomaly monitoring.
- Central health monitoring, disk/CPU/memory alerts, clock synchronization and log rotation.
- Encrypted backups and tested recovery procedure.
- Dedicated public RPC/sentry layer separated from validator signing hosts before public-mainnet promotion.

## Error resilience and recovery

KriptoAman must assume that individual providers, POPs, VPS nodes, RPCs and third-party APIs can fail.

- Multiple independent providers for critical read paths.
- Bounded timeouts and circuit-breaker/fallback behavior.
- Recent verified snapshots may be used only when freshness and provenance are disclosed; fabricated health data is prohibited.
- Production SLO tests must detect transport timeouts and latency regressions.
- A failed component should degrade locally instead of causing cascading failure.
- Restore drills and disaster-recovery evidence must be retained.

## Post-quantum posture

NIST's initial post-quantum standards provide the migration foundation:

- **ML-KEM (FIPS 203)** — key encapsulation.
- **ML-DSA (FIPS 204)** — digital signatures.
- **SLH-DSA (FIPS 205)** — stateless hash-based digital signatures.

The program follows **crypto-agility**: algorithms and key formats must be replaceable without redesigning the entire platform.

### What is protected now

- Long-lived confidential off-chain data should use strong symmetric encryption (AES-256 class) and strict key management.
- Password-derived keys must use salted, intentionally expensive KDFs rather than raw hashes.
- TLS endpoints should migrate to provider-supported hybrid post-quantum key exchange as it becomes production-supported and verifiable.

### What is not yet quantum-resistant

- EVM/KAM account signatures based on elliptic-curve cryptography are vulnerable in principle to a sufficiently capable cryptographically relevant quantum computer.
- Solana Ed25519 account signatures are also classical public-key cryptography and are not post-quantum signatures.
- Existing public blockchain history cannot be made post-quantum merely by changing the website or TLS configuration.

### KAM Network post-quantum migration path

Before calling KAM "quantum-resistant", complete all of the following:

1. protocol-level cryptographic inventory (consensus keys, account signatures, validator identity, TLS, software signing, bridge keys, multisig/treasury);
2. define a crypto-agile account/signature upgrade path compatible with EVM behavior or a reviewed account-abstraction/dual-signature mechanism;
3. prototype hybrid classical + post-quantum authorization using standardized algorithms where technically appropriate;
4. benchmark signature sizes, verification cost, block/gas impact and DoS implications;
5. implement key migration/recovery and backwards-compatibility rules;
6. complete independent cryptographic and implementation review;
7. canary/testnet deployment and adversarial testing;
8. governance-controlled mainnet activation with rollback/recovery planning.

## Harvest-now-decrypt-later protection

Data that must remain confidential for many years receives priority migration because an attacker can steal encrypted data today and attempt decryption later.

Priority classes:

1. identity/KYC records and long-lived personal data;
2. corporate secrets and legal documents;
3. recovery material and privileged infrastructure configuration;
4. API credentials and signing-policy material;
5. historical backups.

Long-lived sensitive data should be minimized, strongly encrypted, access-controlled, rotated where possible, and migrated to post-quantum/hybrid transport and key-establishment mechanisms as supported.

## Release gates

Security hardening is considered healthy only when:

- Security Audit passes;
- CodeQL passes;
- dependency and private-key/secret scans pass;
- production build passes;
- production wallet transaction/signing restrictions remain enforced;
- KAM protected network profile has not changed without an explicit promotion decision;
- crypto-posture audit passes;
- no unsupported claim of "unhackable", "error-free", or "quantum-safe" is used as a technical assurance.

## External assurance

Automated CI and internal review reduce risk but do not replace independent penetration testing, smart-contract audit, cryptographic review, infrastructure assessment, or regulatory/legal review where relevant.

References:
- NIST Post-Quantum Cryptography project: https://www.nist.gov/pqc
- NIST PQC publications and crypto-agility guidance: https://csrc.nist.gov/projects/post-quantum-cryptography/publications
