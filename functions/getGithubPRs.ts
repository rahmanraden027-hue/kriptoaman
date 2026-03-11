import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ORG = 'kriptoaman';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Fetch all repos in the org
    const reposRes = await fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=50&sort=updated`, { headers });
    if (!reposRes.ok) {
      const err = await reposRes.text();
      console.error('GitHub repos error:', err);
      return Response.json({ error: `GitHub API error: ${err}` }, { status: 500 });
    }
    const repos = await reposRes.json();
    console.log(`Found ${repos.length} repos in org ${ORG}`);

    // Fetch open PRs from each repo in parallel
    const prResults = await Promise.all(
      repos.map(async (repo) => {
        const prRes = await fetch(
          `https://api.github.com/repos/${ORG}/${repo.name}/pulls?state=open&per_page=20&sort=updated`,
          { headers }
        );
        if (!prRes.ok) return [];
        const prs = await prRes.json();
        return prs.map(pr => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state,
          repo: repo.name,
          repoFullName: repo.full_name,
          author: pr.user?.login,
          authorAvatar: pr.user?.avatar_url,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          url: pr.html_url,
          labels: pr.labels?.map(l => l.name) || [],
          reviewers: pr.requested_reviewers?.map(r => r.login) || [],
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          draft: pr.draft,
          mergeable: pr.mergeable,
          body: pr.body ? pr.body.substring(0, 300) : '',
        }));
      })
    );

    const allPRs = prResults.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    console.log(`Total open PRs: ${allPRs.length}`);

    return Response.json({ prs: allPRs, repoCount: repos.length });
  } catch (error) {
    console.error('getGithubPRs error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});