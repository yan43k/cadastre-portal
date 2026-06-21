import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { SITE_URL } from "../config";
import { Link } from "react-router-dom";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState<{
    title: string;
    body: string;
    publishedAt: string | null;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const { data } = await api.get<{
          item: { title: string; body: string; publishedAt: string | null };
        }>(`/public/news/${slug}`);
        setItem(data.item);
      } catch {
        setItem(null);
      }
    })();
  }, [slug]);

  if (!item) return <p className="text-ink/70">Загрузка…</p>;

  return (
    <>
      <Helmet>
        <title>{item.title}</title>
        <link rel="canonical" href={`${SITE_URL}/news/${slug}`} />
      </Helmet>
      <Link to="/news" className="text-sm text-sepia no-underline">
        ← Новости
      </Link>
      <h1 className="mt-4 font-display text-4xl text-bistre">{item.title}</h1>
      {item.publishedAt && (
        <p className="mt-2 text-xs text-sepia">
          {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
        </p>
      )}
      <article className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-ink/90">
        {item.body}
      </article>
    </>
  );
}
