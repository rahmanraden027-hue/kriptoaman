import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitPullRequest, RefreshCw, ExternalLink, AlertCircle, Loader2, GitMerge, FileCode, Plus, Minus } from 'lucide-react';

const LABEL_COLORS = {
  'security': 'bg-red-500/20 text-red-400 border-red-500/30',
  'bug': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'enhancement': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'feature': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function PRCard({ pr }) {
  const isSecurityRelated = pr.labels.some(l => l.toLowerCase().includes('security')) ||
    pr.title.toLowerCase().includes('security') ||
    pr.title.toLowerCase().includes('vuln') ||
    pr.title.toLowerCase().includes('cve');

  const age = Math.floor((Date.now() - new Date(pr.createdAt)) / (1000 * 60 * 60 * 24));

  return (
    <div className={`bg-slate-800/60 border rounded-xl p-4 transition-all hover:border-slate-600 ${isSecurityRelated ? 'border-red-500/40' : 'border-slate-700/40'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isSecurityRelated ? 'bg-red-500/20' : 'bg-slate-700'}`}>
            <GitPullRequest className={`w-4 h-4 ${isSecurityRelated ? 'text-red-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-500 shrink-0">#{pr.number}</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono shrink-0">{pr.repo}</span>
              {pr.draft && <span className="text-xs bg-slate-600/50 text-slate-400 px-2 py-0.5 rounded shrink-0">Draft</span>}
              {isSecurityRelated && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-semibold shrink-0">🔒 Security</span>}
            </div>
            <h4 className="text-white font-semibold text-sm leading-snug mb-2">{pr.title}</h4>
            {pr.body && <p className="text-slate-400 text-xs leading-relaxed mb-2 line-clamp-2">{pr.body}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {pr.labels.map(label => (
                <span key={label} className={`text-xs px-2 py-0.5 rounded border ${LABEL_COLORS[label.toLowerCase()] || 'bg-slate-700/50 text-slate-400 border-slate-600/30'}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <a href={pr.url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-4 flex-wrap text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <img src={pr.authorAvatar} alt={pr.author} className="w-4 h-4 rounded-full" />
          <span>{pr.author}</span>
        </div>
        {pr.changedFiles != null && (
          <div className="flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5" />
            <span>{pr.changedFiles} files</span>
          </div>
        )}
        {pr.additions != null && (
          <div className="flex items-center gap-1 text-green-500">
            <Plus className="w-3.5 h-3.5" />
            <span>{pr.additions}</span>
          </div>
        )}
        {pr.deletions != null && (
          <div className="flex items-center gap-1 text-red-400">
            <Minus className="w-3.5 h-3.5" />
            <span>{pr.deletions}</span>
          </div>
        )}
        {pr.reviewers.length > 0 && (
          <div className="flex items-center gap-1">
            <span>Reviewers: {pr.reviewers.join(', ')}</span>
          </div>
        )}
        <span className="ml-auto">{age}d ago</span>
      </div>
    </div>
  );
}

export default function GitHubSecurityReview() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['githubPRs'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getGithubPRs', {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const prs = data?.prs || [];
  const securityPRs = prs.filter(pr =>
    pr.labels.some(l => l.toLowerCase().includes('security')) ||
    pr.title.toLowerCase().includes('security') ||
    pr.title.toLowerCase().includes('vuln') ||
    pr.title.toLowerCase().includes('cve')
  );

  const filteredPRs = filter === 'security' ? securityPRs : prs;

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-xl">
            <GitMerge className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">GitHub PR Security Review</h3>
            <p className="text-slate-500 text-xs">Org: kriptoaman · {data?.repoCount || 0} repos</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: `All PRs (${prs.length})` },
          { key: 'security', label: `🔒 Security (${securityPRs.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-slate-400 text-sm">Fetching pull requests...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error.message || 'Gagal mengambil data GitHub'}</p>
        </div>
      ) : filteredPRs.length === 0 ? (
        <div className="text-center py-10">
          <GitPullRequest className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">
            {filter === 'security' ? 'Tidak ada PR security yang ditemukan' : 'Tidak ada open pull requests'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredPRs.map(pr => <PRCard key={`${pr.repo}-${pr.number}`} pr={pr} />)}
        </div>
      )}
    </div>
  );
}