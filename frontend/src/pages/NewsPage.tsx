import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type News = { id: string; slug: string; title: string; summary: string | null; publishedAt: string | null };

export default function NewsPage() {
  const [items, setItems] = useState<News[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: News[] }>("/public/news?take=20");
        setItems(data.items);
      } catch {
        /* */
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>Новости</title>
        <link rel="canonical" href={`${SITE_URL}/news`} />
      </Helmet>
      <SectionLabel>Лента</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Новости и уведомления</h1>
      <div className="mt-8 space-y-4">
        {items.map((n) => (
          <Panel key={n.id}>
            <Link to={`/news/${n.slug}`} className="font-display text-xl text-bistre no-underline">
              {n.title}
            </Link>
            {n.summary && <p className="mt-2 text-sm text-ink/80">{n.summary}</p>}
            {n.publishedAt && (
              <p className="mt-3 text-xs text-sepia">
                {new Date(n.publishedAt).toLocaleDateString("ru-RU")}
              </p>
            )}
          </Panel>
        ))}
      </div>
    </>
  );
}
