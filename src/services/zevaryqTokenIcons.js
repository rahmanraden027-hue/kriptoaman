// ZEVARYQ Wallet verified local icon registry.
//
// IMPORTANT: ERC-20 entries MUST be keyed by a verified Chain 22028 contract
// address. Never resolve a token logo from symbol alone: symbols are not unique
// and doing so can visually impersonate another asset.
//
// Add production contracts here only after deployment/registry verification.
// Planned ecosystem identities remain presentation-only in Wallet.jsx.
export const ZEVARYQ_TOKEN_ICON_REGISTRY = Object.freeze({});

export function resolveZevaryqTokenIcon(contractAddress, explorerIconUrl = null) {
  const remote = typeof explorerIconUrl === 'string' && /^https:\/\//i.test(explorerIconUrl)
    ? explorerIconUrl
    : null;
  const address = String(contractAddress || '').toLowerCase();
  return ZEVARYQ_TOKEN_ICON_REGISTRY[address] || remote;
}
