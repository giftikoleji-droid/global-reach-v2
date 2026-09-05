import { useEffect, useState } from "react";
import { fetchNews, type NewsRow } from "../lib/market";

export function NewsTicker({ hidden }: { hidden?: boolean }) {
  const [items, setItems] = useState<NewsRow[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const news = await fetchNews();
      if (alive && news.length > 0) {
        setItems(news);
      }
    }
    load();
    const t = setInterval(load, 120_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const loop = items.length ? [...items, ...items] : [];

  return (
    <div className={"news-ticker" + (hidden ? " hidden" : "")} id="newsTicker">
      <div className="news-label">
        <i /> Market News
      </div>
      <div className="news-track">
        <div className="news-track-inner">
          {loop.length === 0 ? (
            <span className="news-item">
              <span className="src">Newswire</span> · Initialising institutional data feed…
            </span>
          ) : (
            loop.map((n, i) =>
              n.url ? (
                <a className="news-item" key={i} href={n.url} target="_blank" rel="noopener noreferrer">
                  <span className="src">{n.source}</span> · {n.title}
                </a>
              ) : (
                <span className="news-item" key={i}>
                  <span className="src">{n.source}</span> · {n.title}
                </span>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
