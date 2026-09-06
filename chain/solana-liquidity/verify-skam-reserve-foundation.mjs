import fs from 'node:fs';
import { PublicKey } from '@solana/web3.js';

const POLICY_PATH = new URL('./skam-reserve-policy.json', import.meta.url);
const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));

// Phase 1 security boundary: every value used in an outbound RPC request is
// pinned in reviewed source. Reserve-scale transfers remain disabled until the
// created Squads multisig/vault addresses are added through a separate PR.
const MINT = 'Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi';
const OPERATOR = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const SIGNER_2 = '9kyjft13umxb92C11qr9v6L8HnJ3t1cZuDohc5wLrFqB';
const SIGNER_3 = '9qhMmV5T9gfPQ4yCZPMVgDbHUR9F65c3xBKnEmWLYxT2';
const PINNED_MEMBERS = [OPERATOR, SIGNER_2, SIGNER_3];
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const SQUADS_V4 = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
const TOKEN_DECIMALS = 9;
const FIXED_SUPPLY_UI = 1_000_000_000n;
const STRATEGIC_RESERVE_UI = 200_000_000n;
const ECOSYSTEM_RESERVE_UI = 100_000_000n;
const RESERVED_TOTAL_UI = 300_000_000n;
const SCALE = 10n ** BigInt(TOKEN_DECIMALS);
const EXPECTED_SUPPLY = FIXED_SUPPLY_UI * SCALE;
const RESERVED_TOTAL = RESERVED_TOTAL_UI * SCALE;
const RPC_URLS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];

function requirePolicyMatch(actual, expected, label) {
  if (String(actual) !== String(expected)) throw new Error(`Policy/code mismatch for ${label}: ${actual}`);
}

function requireValidDistinctMembers(members) {
  if (!Array.isArray(members) || members.length !== 3) throw new Error('Policy must contain exactly three multisig members.');
  const addresses = members.map((member) => String(member?.address || ''));
  for (const address of addresses) {
    const normalized = new PublicKey(address).toBase58();
    if (normalized !== address) throw new Error(`Non-canonical Solana member address: ${address}`);
  }
  if (new Set(addresses).size !== 3) throw new Error('Multisig member addresses must be distinct.');
  if (addresses.join(',') !== PINNED_MEMBERS.join(',')) throw new Error(`Pinned multisig member set/order mismatch: ${addresses.join(',')}`);
  return addresses;
}

requirePolicyMatch(policy.schemaVersion, 2, 'schemaVersion');
requirePolicyMatch(policy.token.mint, MINT, 'mint');
requirePolicyMatch(policy.operator, OPERATOR, 'operator');
requirePolicyMatch(policy.token.decimals, TOKEN_DECIMALS, 'decimals');
requirePolicyMatch(policy.token.fixedSupplyUi, FIXED_SUPPLY_UI, 'fixedSupplyUi');
requirePolicyMatch(policy.allocation.strategicReserveUi, STRATEGIC_RESERVE_UI, 'strategicReserveUi');
requirePolicyMatch(policy.allocation.ecosystemReserveUi, ECOSYSTEM_RESERVE_UI, 'ecosystemReserveUi');
requirePolicyMatch(policy.allocation.reservedTotalUi, RESERVED_TOTAL_UI, 'reservedTotalUi');
requirePolicyMatch(policy.treasuryFoundation.programId, SQUADS_V4, 'Squads program');
requirePolicyMatch(policy.treasuryFoundation.requiredIndependentMembers, 3, 'multisig member count');
requirePolicyMatch(policy.treasuryFoundation.threshold, 2, 'multisig threshold');
requirePolicyMatch(policy.treasuryFoundation.globalTimelockSeconds, 86400, 'global timelock');
requirePolicyMatch(policy.treasuryFoundation.memberAddressesPinned, true, 'memberAddressesPinned');
const pinnedMembers = requireValidDistinctMembers(policy.treasuryFoundation.members);

function parseMintBase(data) {
  if (!(data instanceof Uint8Array) || data.length < 82) throw new Error('Mint account data is too short.');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const mintAuthorityOption = view.getUint32(0, true);
  const mintAuthority = mintAuthorityOption === 1 ? new PublicKey(data.slice(4, 36)).toBase58() : null;
  let supply = 0n;
  for (let i = 7; i >= 0; i -= 1) supply = (supply << 8n) | BigInt(data[36 + i]);
  const decimals = data[44];
  const initialized = data[45] === 1;
  const freezeAuthorityOption = view.getUint32(46, true);
  const freezeAuthority = freezeAuthorityOption === 1 ? new PublicKey(data.slice(50, 82)).toBase58() : null;
  return { mintAuthority, supply, decimals, initialized, freezeAuthority };
}

async function rpc(method, params) {
  let lastError;
  for (const url of RPC_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.error) throw new Error(payload.error.message || JSON.stringify(payload.error));
      return { result: payload.result, provider: new URL(url).hostname };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`All RPC providers failed for ${method}.`);
}

async function operatorTokenBalanceRaw() {
  const { result } = await rpc('getTokenAccountsByOwner', [OPERATOR, { mint: MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
  return (result?.value || []).reduce((sum, entry) => {
    const amount = entry?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return sum + BigInt(amount || '0');
  }, 0n);
}

function ui(raw) {
  const whole = raw / SCALE;
  const remainder = raw % SCALE;
  if (remainder === 0n) return whole.toString();
  return `${whole}.${remainder.toString().padStart(TOKEN_DECIMALS, '0').replace(/0+$/, '')}`;
}

const { result: mintResult, provider } = await rpc('getAccountInfo', [MINT, { encoding: 'base64', commitment: 'confirmed' }]);
if (!mintResult?.value) throw new Error('sKAM mint was not found on Solana mainnet.');
if (mintResult.value.owner !== TOKEN_2022_PROGRAM_ID) throw new Error(`Unexpected mint owner: ${mintResult.value.owner}`);
const mintData = Uint8Array.from(Buffer.from(mintResult.value.data[0], 'base64'));
const mint = parseMintBase(mintData);
if (!mint.initialized) throw new Error('sKAM mint is not initialized.');
if (mint.decimals !== TOKEN_DECIMALS) throw new Error(`Decimals mismatch: ${mint.decimals}`);
if (mint.supply !== EXPECTED_SUPPLY) throw new Error(`Supply mismatch: ${mint.supply}`);

const operatorRaw = await operatorTokenBalanceRaw();
const operatorCanFund = operatorRaw >= RESERVED_TOTAL;
const authoritiesStillOperator = mint.mintAuthority === OPERATOR && mint.freezeAuthority === OPERATOR;
const technicalPrerequisitesPass = authoritiesStillOperator && operatorCanFund && pinnedMembers.length === 3;
const independentControlAttested = policy.treasuryFoundation.independentControlAttestationComplete === true;
const safeToCreateMultisig = technicalPrerequisitesPass && independentControlAttested;

const report = {
  audit: 'sKAM reserve foundation read-only verifier — phase 1 member pinning',
  checkedAt: new Date().toISOString(),
  provider,
  stage: independentControlAttested ? 'READY_TO_CREATE_MULTISIG' : 'AWAITING_INDEPENDENT_SIGNER_ATTESTATION',
  technicalPrerequisitesPass,
  safeToCreateMultisig,
  safeToFundReserves: false,
  safeToRevokeAuthorities: false,
  token: {
    mint: MINT,
    supplyUi: ui(mint.supply),
    decimals: mint.decimals,
    mintAuthority: mint.mintAuthority,
    freezeAuthority: mint.freezeAuthority,
  },
  operator: {
    address: OPERATOR,
    skamBalanceUi: ui(operatorRaw),
    canFundReservedTotal: operatorCanFund,
  },
  governance: {
    expectedProgramId: SQUADS_V4,
    multisigAddress: null,
    multisigProgramVerified: false,
    pinnedMembers,
    requiredIndependentMembers: 3,
    independentControlAttested,
    threshold: '2-of-3',
    globalTimelockSeconds: 86400,
    unilateralConfigAuthorityAllowed: false,
    spendingLimitsAllowedAtFoundation: false,
  },
  reserves: {
    strategicVaultOwner: null,
    strategicExpectedUi: STRATEGIC_RESERVE_UI.toString(),
    strategicObservedUi: null,
    ecosystemVaultOwner: null,
    ecosystemExpectedUi: ECOSYSTEM_RESERVE_UI.toString(),
    ecosystemObservedUi: null,
    balancesExact: false,
  },
  warnings: [
    ...(independentControlAttested ? [] : ['Independent signer control has not yet been attested. Do not create the multisig until each signer is confirmed to use independent seed material or an independent signing device.']),
    'Reserve vault addresses are not pinned yet. Do not move reserve-scale balances.',
    'Authority revocation is intentionally blocked until a follow-up PR pins and verifies the Squads multisig and both reserve vaults.',
    ...(operatorCanFund ? [] : ['Operator does not currently hold enough sKAM to fund the full 300M reserve target.']),
    ...(authoritiesStillOperator ? [] : ['Mint/freeze authority state changed from the approved pre-reserve state; stop and re-audit.']),
  ],
};

// Network-derived evidence is stdout-only; the workflow captures it externally
// as a non-secret artifact.
console.log(JSON.stringify(report, null, 2));

if (!technicalPrerequisitesPass) process.exitCode = 2;
