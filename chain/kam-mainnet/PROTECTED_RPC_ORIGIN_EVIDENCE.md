# KAM Mainnet Protected RPC Origin Evidence

Status: **operator evidence procedure — does not itself promote KAM to public mainnet**.

This procedure verifies the remaining `dedicatedProtectedRpcOrigin` promotion gate without exposing the protected origin URL, private IPs, credentials, validator keys, or Cloudflare secrets.

## What the gate proves

The protected workflow combines operator-attested infrastructure facts with active read-only probes from the private evidence runner. A passing result requires all of the following:

1. the four-host topology evidence is fresh and still proves four distinct validator hosts;
2. the RPC sentry host is separate from the validator hosts;
3. the protected origin input references the same RPC-sentry host fingerprint as the four-host evidence;
4. the nominated protected origin is not the public `rpc.kriptoaman.com` hostname;
5. the operator has freshly attested that the deployed Cloudflare `KAM_RPC_ORIGIN` secret points to that nominated protected origin;
6. the operator has freshly attested that direct public bypass to the protected origin is blocked;
7. the operator has freshly attested that the explorer uses the approved protected RPC path;
8. the protected origin and public gateway both return Chain ID `0x560c`;
9. their block heights remain within the configured tolerance;
10. the same shared block height resolves to the same canonical block hash on both paths;
11. the protected origin reports exactly four QBFT validators;
12. the public gateway continues to block the QBFT management namespace.

The redacted output includes only counts, booleans, latencies and SHA-256 fingerprints. It never prints the protected origin URL.

## Protected runner input

Create the following file **only on the protected evidence runner**:

`/var/lib/kam-evidence/protected-rpc-origin-input.json`

Use `protected-rpc-origin-input.example.json` as the schema. The real file must be mode `0400` or `0600` and must never be committed or uploaded.

Required fields:

- `checkedAt`: current UTC timestamp;
- `protectedOriginUrl`: the actual protected RPC/sentry URL reachable from the private runner;
- `rpcSentryHostFingerprint`: the SHA-256 host fingerprint from the current four-host topology evidence;
- `cloudflareOriginSecretAttested`: set `true` only after verifying the deployed Worker secret points to this exact origin;
- `originPublicBypassBlockedAttested`: set `true` only after verifying the protected origin cannot be reached directly from the public Internet;
- `explorerUsesProtectedPathAttested`: set `true` only after verifying Explorer uses the approved protected RPC path.

Do not infer any of these booleans from documentation alone.

## Run the gate

First produce current four-host evidence following `FOUR_HOST_EVIDENCE_COLLECTION.md`. Then manually run:

`KAM Protected RPC Origin Gate`

The workflow runs only on the protected self-hosted runner labelled:

`kam-mainnet-evidence`

Retain the `kam-protected-rpc-origin-evidence` artifact and record its workflow run ID and artifact digest in Issue #115.

## Promotion rule

A passing artifact is necessary before `dedicatedProtectedRpcOrigin` may be changed to `true` in `promotion-readiness.json`.

Do not set `continuity24h=true` from historical samples. After both `fourDistinctValidatorHosts` and `dedicatedProtectedRpcOrigin` are independently evidenced, start a fresh continuity window for the final production topology.
