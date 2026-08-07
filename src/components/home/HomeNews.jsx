import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';

function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  return `${Math.floor(s / 86400)}h lalu`;
}

export default function HomeNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
      .then(r => r.json())
      .then(d => { if (alive) setNews((d?.Data || []).slice(0, 6)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
        <Newspaper className="w-4 h-4 text-ka-emerald" /> Berita Kripto
      </h3>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-20 ka-shimmer rounded-2xl" />)}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8">
          <Newspaper className="w-8 h-8 ka-muted opacity-40 mx-auto mb-2" />
          <p className="ka-muted text-xs">Berita tidak tersedia saat ini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {news.map((n) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
              className="flex gap-3 p-2.5 rounded-2xl ka-surface-hover">
              {n.imageurl && (
                <img src={n.imageurl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{n.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] ka-muted font-semibold">{n.source_info?.name || n.source}</span>
                  <span className="text-[10px] ka-muted">·</span>
                  <span className="text-[10px] ka-muted">{timeAgo(n.published_on)}</span>
                  <ExternalLink className="w-3 h-3 ka-muted ml-auto" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}