import fs from 'node:fs';
import { PublicKey } from '@solana/web3.js';

const POLICY_PATH = new URL('./skam-reserve-policy.json', import.meta.url);
const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
const MINT = policy.token.mint;
const OPERATOR = policy.operator;
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const SCALE = 10n ** BigInt(policy.token.decimals);
const EXPECTED_SUPPLY = BigInt(policy.token.fixedSupplyUi) * SCALE;
const STRATEGIC_RESERVE = BigInt(policy.allocation.strategicReserveUi) * SCALE;
const ECOSYSTEM_RESERVE = BigInt(policy.allocation.ecosystemReserveUi) * SCALE;
const RESERVED_TOTAL = BigInt(policy.allocation.reservedTotalUi) * SCALE;
const SQUADS_V4 = policy.treasuryFoundation.programId;
const RPC_URLS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];

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

async function tokenBalanceRaw(owner) {
  const { result } = await rpc('getTokenAccountsByOwner', [owner, { mint: MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
  return (result?.value || []).reduce((sum, entry) => {
    const amount = entry?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return sum + BigInt(amount || '0');
  }, 0n);
}

async function accountOwner(address) {
  const { result } = await rpc('getAccountInfo', [address, { encoding: 'base64', commitment: 'confirmed' }]);
  return result?.value?.owner || null;
}

function ui(raw) {
  const whole = raw / SCALE;
  const remainder = raw % SCALE;
  if (remainder === 0n) return whole.toString();
  return `${whole}.${remainder.toString().padStart(policy.token.decimals, '0').replace(/0+$/, '')}`;
}

const { result: mintResult, provider } = await rpc('getAccountInfo', [MINT, { encoding: 'base64', commitment: 'confirmed' }]);
if (!mintResult?.value) throw new Error('sKAM mint was not found on Solana mainnet.');
if (mintResult.value.owner !== TOKEN_2022_PROGRAM_ID) throw new Error(`Unexpected mint owner: ${mintResult.value.owner}`);
const mintData = Uint8Array.from(Buffer.from(mintResult.value.data[0], 'base64'));
const mint = parseMintBase(mintData);
if (!mint.initialized) throw new Error('sKAM mint is not initialized.');
if (mint.decimals !== policy.token.decimals) throw new Error(`Decimals mismatch: ${mint.decimals}`);
if (mint.supply !== EXPECTED_SUPPLY) throw new Error(`Supply mismatch: ${mint.supply}`);

const operatorRaw = await tokenBalanceRaw(OPERATOR);
const strategicVault = process.env.STRATEGIC_VAULT_OWNER?.trim() || policy.treasuryFoundation.strategicVaultOwner;
const ecosystemVault = process.env.ECOSYSTEM_VAULT_OWNER?.trim() || policy.treasuryFoundation.ecosystemVaultOwner;
const multisigAddress = process.env.SQUADS_MULTISIG_ADDRESS?.trim() || policy.treasuryFoundation.multisigAddress;

let strategicRaw = null;
let ecosystemRaw = null;
let multisigProgramOwner = null;
if (strategicVault) strategicRaw = await tokenBalanceRaw(strategicVault);
if (ecosystemVault) ecosystemRaw = await tokenBalanceRaw(ecosystemVault);
if (multisigAddress) multisigProgramOwner = await accountOwner(multisigAddress);

const vaultsConfigured = Boolean(strategicVault && ecosystemVault && multisigAddress);
const multisigProgramVerified = multisigAddress ? multisigProgramOwner === SQUADS_V4 : false;
const reserveBalancesExact = strategicRaw === STRATEGIC_RESERVE && ecosystemRaw === ECOSYSTEM_RESERVE;
const operatorCanFund = operatorRaw >= RESERVED_TOTAL;
const authoritiesStillOperator = mint.mintAuthority === OPERATOR && mint.freezeAuthority === OPERATOR;
const authoritiesRevoked = mint.mintAuthority === null && mint.freezeAuthority === null;

let stage = 'AWAITING_MULTISIG_VAULT_ADDRESSES';
if (vaultsConfigured && !multisigProgramVerified) stage = 'BLOCKED_MULTISIG_PROGRAM_MISMATCH';
else if (vaultsConfigured && !reserveBalancesExact) stage = 'READY_FOR_TEST_AND_RESERVE_FUNDING';
else if (vaultsConfigured && reserveBalancesExact && authoritiesStillOperator) stage = 'RESERVES_FUNDED_AUTHORITY_REVOKE_PENDING';
else if (vaultsConfigured && reserveBalancesExact && authoritiesRevoked) stage = 'FOUNDATION_HARDENED';
else if (vaultsConfigured && reserveBalancesExact) stage = 'BLOCKED_UNEXPECTED_AUTHORITY_STATE';

const report = {
  audit: 'sKAM reserve foundation read-only verifier',
  checkedAt: new Date().toISOString(),
  provider,
  stage,
  safeToCreateMultisig: authoritiesStillOperator && operatorCanFund,
  safeToFundReserves: vaultsConfigured && multisigProgramVerified && authoritiesStillOperator && operatorCanFund,
  safeToRevokeAuthorities: vaultsConfigured && multisigProgramVerified && reserveBalancesExact && authoritiesStillOperator,
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
    multisigAddress,
    multisigProgramOwner,
    multisigProgramVerified,
    threshold: `${policy.treasuryFoundation.threshold}-of-${policy.treasuryFoundation.requiredIndependentMembers}`,
    globalTimelockSeconds: policy.treasuryFoundation.globalTimelockSeconds,
  },
  reserves: {
    strategicVaultOwner: strategicVault,
    strategicExpectedUi: policy.allocation.strategicReserveUi,
    strategicObservedUi: strategicRaw == null ? null : ui(strategicRaw),
    ecosystemVaultOwner: ecosystemVault,
    ecosystemExpectedUi: policy.allocation.ecosystemReserveUi,
    ecosystemObservedUi: ecosystemRaw == null ? null : ui(ecosystemRaw),
    balancesExact: reserveBalancesExact,
  },
  warnings: [
    ...(vaultsConfigured ? [] : ['No reserve vault addresses are pinned yet. Do not move reserve-scale balances until they are configured and verified.']),
    ...(operatorCanFund ? [] : ['Operator does not currently hold enough sKAM to fund the full 300M reserve target.']),
    ...(multisigAddress && !multisigProgramVerified ? ['Configured multisig account is not owned by the expected Squads v4 program.'] : []),
    ...(authoritiesRevoked && !reserveBalancesExact ? ['Authorities are already revoked but reserve balances are not exact; manual review is required.'] : []),
  ],
};

fs.mkdirSync(new URL('./artifacts/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./artifacts/skam-reserve-foundation-readiness.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (stage.startsWith('BLOCKED_')) process.exitCode = 2;
