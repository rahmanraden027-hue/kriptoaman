# KAM Explorer + Developer Center Finalization — 2026-09-08

## Objective
Raise the public KriptoAman Mainnet Explorer from the prior 7.5/10 audit baseline to a production-grade final surface by fixing the deployment rollback defect and adding developer-facing transparency surfaces without modifying chain state, indexed history, treasury data, validator credentials, or private keys.

## Public final surfaces
- `/` — KAM Explorer V2 overview
- `/stats` — verified statistics, replacing the placeholder Blockscout Stats view
- `/tokens` — canonical-aware token registry
- `/developer` and `/developers` — KAM Developer Center
- `/addresses` — recently observed address evidence + CSV export
- `/validators` — proposer observatory based only on indexed block evidence
- `/contracts` — verified smart-contract discovery and verification capability
- `/status` — public service status based on endpoint evidence
- `/api-docs` — underlying Blockscout API schema remains intact

## Deployment defect fixed
The prior rollout could falsely fail under `set -o pipefail` because the verification pattern used `curl ... | grep -q`. Once `grep -q` found the marker it could close the pipe early, causing curl exit code 23 (`Failure writing output to destination`). The error trap then restored the previous proxy template even though the new page had actually become reachable.

The final deploy writes verification responses to temporary files before matching markers. This removes the false failure while preserving rollback for genuine errors.

## Safety principles
- exact Nginx routes only; Blockscout catch-all/detail routes remain untouched
- isolated Docker helper for protected proxy filesystem writes
- no privileged container
- rollback of the proxy template on genuine deploy errors
- no fabricated KPI, holder ranking, validator count, stake weight, price, supply, or uptime claims
- no private keys, seed phrases, validator credentials, treasury secrets, or genesis mutation
- API/detail smoke checks remain required after deployment

## Final acceptance gate
The release is considered final only when CI preflight passes, the self-hosted Explorer deployment succeeds, post-deploy markers and headers are observed publicly, core API JSON remains healthy, and known transaction/WKAM detail routes continue to resolve.
