# KAM Blockscout Recovery Host

Production recovery target:

- Droplet: `kam-explorer-blockscout-01`
- DigitalOcean ID: `601607427`
- Public IP: `146.190.93.254`
- Region: `sgp1`
- Size: 4 vCPU / 8 GB RAM / 160 GB SSD
- OS: Ubuntu 24.04 LTS
- Blockscout: pinned to `v11.2.3`
- KAM Chain ID: `22028 / 0x560c`
- RPC source: `https://explorer.kriptoaman.com/rpc`

The bootstrap script installs an API-only Blockscout origin. It does **not** modify KAM chain state, validator keys, genesis, or RPC history.

Run from the newly provisioned host as root:

```bash
curl -fsSL https://raw.githubusercontent.com/rahmanraden027-hue/kriptoaman/main/scripts/bootstrap-kam-blockscout-vps.sh | bash
```

Safety defaults:

- PostgreSQL ports bind to loopback only.
- Stats and visualizer ports bind to loopback only.
- Public port 80 exposes only `/api/*` plus `/healthz`.
- Internal transaction, pending transaction, and replaced transaction fetchers start disabled until trace support is verified.
- Database passwords and `SECRET_KEY_BASE` are generated on-host and stored root-only.
- Existing KAM Mainnet infrastructure is untouched.
