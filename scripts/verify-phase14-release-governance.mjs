import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../release/phase14-release-governance.json', import.meta.url), 'utf8'));

const fail = (message) => {
  console.error('PHASE14_GOVERNANCE_FAIL:', message);
  process.exit(2);
};

if (manifest.phase !== '14') fail('unexpected phase');
if (!['transition-active', 'locked'].includes(manifest.status)) fail('governance status is not enforceable');
if (manifest.repository !== 'rahmanraden027-hue/kriptoaman') fail('repository identity mismatch');
if (manifest.governanceGate?.requiredContext !== 'kriptoaman/production-security') fail('required governance context changed');
if (manifest.governanceGate?.workflow !== '.github/workflows/security-audit.yml') fail('security workflow changed');
if (manifest.ruleset?.enforcement !== 'active') fail('expected ruleset enforcement is not active');
if (manifest.ruleset?.strictRequiredStatusChecks !== true) fail('strict status policy is required');
if (manifest.ruleset?.requirePullRequest !== true) fail('pull requests must remain required');
if (manifest.ruleset?.requireReviewThreadResolution !== true) fail('review thread resolution must remain required');
if (manifest.ruleset?.blockDeletion !== true || manifest.ruleset?.blockNonFastForward !== true) fail('main history protection weakened');
if (Number(manifest.ruleset?.bypassActors) !== 0) fail('ruleset bypass actors are not allowed');

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'KriptoAman-Phase14-Governance/1.0',
  'X-GitHub-Api-Version': '2022-11-28',
};
if (token) headers.Authorization = `Bearer ${token}`;

const url = `https://api.github.com/repos/${manifest.repository}/rulesets/${manifest.ruleset.id}`;
const response = await fetch(url, { headers, redirect: 'follow' });
if (!response.ok) fail(`ruleset lookup failed HTTP ${response.status}`);
const ruleset = await response.json();

if (ruleset.name !== manifest.ruleset.name) fail('live ruleset name mismatch');
if (ruleset.enforcement !== 'active') fail('live ruleset is not active');
if (ruleset.target !== 'branch') fail('live ruleset target changed');
if (!Array.isArray(ruleset.conditions?.ref_name?.include) || !ruleset.conditions.ref_name.include.includes('~DEFAULT_BRANCH')) {
  fail('live ruleset no longer targets the default branch');
}
if (Array.isArray(ruleset.bypass_actors) && ruleset.bypass_actors.length !== 0) fail('live ruleset has bypass actors');

const rules = Array.isArray(ruleset.rules) ? ruleset.rules : [];
const byType = new Map(rules.map((rule) => [rule.type, rule]));
if (!byType.has('deletion')) fail('deletion protection missing');
if (!byType.has('non_fast_forward')) fail('non-fast-forward protection missing');

const pr = byType.get('pull_request');
if (!pr) fail('pull request rule missing');
if (pr.parameters?.required_review_thread_resolution !== true) fail('review-thread resolution is no longer required');

const statusRule = byType.get('required_status_checks');
if (!statusRule) fail('required status checks rule missing');
if (statusRule.parameters?.strict_required_status_checks_policy !== true) fail('strict required-status policy disabled');

const liveContexts = new Set((statusRule.parameters?.required_status_checks || []).map((item) => item.context));
for (const context of manifest.ruleset.requiredStatusContexts) {
  if (!liveContexts.has(context)) fail(`required status context missing: ${context}`);
}

console.log(JSON.stringify({
  phase: 14,
  status: 'PASS',
  rulesetId: ruleset.id,
  rulesetName: ruleset.name,
  enforcement: ruleset.enforcement,
  strict: true,
  requiredContexts: [...liveContexts].sort(),
  pullRequestRequired: true,
  reviewThreadsRequired: true,
  deletionBlocked: true,
  forcePushBlocked: true,
}, null, 2));
