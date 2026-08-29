# Issue #302 recovery checklist

- [ ] Homepage HTTP check passes
- [ ] Auth readiness HTTP check passes
- [ ] SystemStatus HTTP check passes
- [ ] RPC `eth_chainId` equals `0x560c`
- [ ] RPC `eth_blockNumber` returns a valid progressing height
- [ ] Known KAM transaction receipt is retrievable
- [ ] Blockscout backend can reach the RPC
- [ ] Blockscout indexed block height progresses
- [ ] Latest blocks appear in explorer
- [ ] Latest transactions appear when transactions exist
- [ ] Homepage health statistics are populated when dependencies are healthy
- [ ] Repeated low-rate smoke runs pass
- [ ] Only then resume staging capacity progression
