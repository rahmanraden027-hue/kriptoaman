# Production smoke scope

Tracking: #302

The production smoke change is intentionally isolated from application behavior. It adds monitoring code, tests, workflow configuration, and operational documentation only. It does not alter frontend routes, authentication implementation, market data logic, KAM contracts, validator configuration, RPC configuration, explorer configuration, wallets, treasury, balances, supply, genesis, DNS, or secrets.
