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
      .then(d => { if (alive) setNews((d?.Data || []).slice(0, 4)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="ka-surface p-4 ka-fade-up">
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
        <Newspaper className="w-4 h-4 text-ka-emerald" /> Berita Kripto
      </h3>

      {loading ? (
        <div className="space-y-2">
          {[0,1].map(i => <div key={i} className="h-16 ka-shimmer rounded-2xl" />)}
        </div>
      ) : news.length === 0 ? (
        <p className="ka-muted text-xs text-center py-6">Berita tidak tersedia saat ini.</p>
      ) : (
        <div className="space-y-2">
          {news.map((n) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
              className="flex gap-3 p-2.5 rounded-2xl ka-surface-hover">
              {n.imageurl && (
                <img src={n.imageurl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{n.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
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