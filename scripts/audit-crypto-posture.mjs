import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const [password, headers, provider, localWalletPage, networkProfileRaw, baseline] = await Promise.all([
  read('server/auth/password.js'),
  read('public/_headers'),
  read('src/components/web3/Web3Provider.jsx'),
  read('src/pages/MultiChainWallet.jsx'),
  read('chain/kam-mainnet/network-profile.json'),
  read('docs/SECURITY_PQC_BASELINE_2026.md'),
]);

const networkProfile = JSON.parse(networkProfileRaw);

add(
  'password-kdf-salted',
  /PBKDF2/.test(password) && /getRandomValues/.test(password) && /SALT_BYTES/.test(password),
  'First-party passwords use a salted PBKDF2 derivation rather than a raw password hash.',
);
add(
  'password-constant-time-verify',
  /constantTimeEqual/.test(password),
  'Password verification includes a constant-time comparison.',
);
add(
  'password-minimum-length',
  /password\.length < 12/.test(password),
  'First-party password policy requires at least 12 characters.',
);
add(
  'csp-no-unsafe-eval',
  /Content-Security-Policy/.test(headers) && !headers.includes("'unsafe-eval'"),
  'Public CSP is present and does not allow unsafe-eval.',
);
add(
  'external-wallet-release-read-only',
  /READ_ONLY_RELEASE/.test(provider)
    && /Transaksi dinonaktifkan/.test(provider)
    && /Penandatanganan dinonaktifkan/.test(provider),
  'Public external-wallet release explicitly blocks transaction execution and signing.',
);
add(
  'browser-local-self-custody-production-gated',
  /Controlled Security Gate/.test(localWalletPage)
    && /tidak membuat, menyimpan, membaca, atau menandatangani transaksi/.test(localWalletPage)
    && /to="\/Wallet"/.test(localWalletPage)
    && !/loadWallet\(|decryptData\(|sessionStorage|getItem\('btc_wallet'\)/.test(localWalletPage),
  'Historical browser-local self-custody page no longer reads wallet secrets and redirects users to the external-wallet production path.',
);
add(
  'kam-commercial-launch-disabled',
  networkProfile.commercialLaunchEnabled === false,
  'KAM protected profile still blocks commercial launch until promotion evidence is complete.',
);
add(
  'kam-testnet-key-reuse-disabled',
  networkProfile.reuseTestnetKeys === false,
  'KAM protected profile prohibits reuse of testnet signing keys.',
);
add(
  'pqc-no-false-assurance',
  /must not claim[\s\S]*post-quantum safe/i.test(baseline)
    && /not yet quantum-resistant/i.test(baseline)
    && /ML-KEM/.test(baseline)
    && /ML-DSA/.test(baseline)
    && /SLH-DSA/.test(baseline),
  'PQC baseline names standardized migration targets and explicitly rejects unsupported quantum-safety claims.',
);
add(
  'crypto-agility-roadmap',
  /crypto-agility/i.test(baseline)
    && /protocol-level cryptographic inventory/i.test(baseline)
    && /independent cryptographic and implementation review/i.test(baseline),
  'KAM has a documented crypto-agility and independent-review migration path.',
);

const failures = checks.filter((check) => !check.ok);
const report = {
  checkedAt: new Date().toISOString(),
  status: failures.length ? 'fail' : 'pass',
  summary: {
    checks: checks.length,
    passed: checks.length - failures.length,
    failed: failures.length,
  },
  quantumPosture: {
    claim: 'migration-in-progress-not-quantum-safe',
    standardizedTargets: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    classicalBlockchainSignaturesRequireProtocolUpgrade: true,
  },
  checks,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(2);
