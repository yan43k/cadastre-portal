import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string;
  steps: string[];
  documents: string[];
  timelineNote: string | null;
  priceFromRub: number | null;
};

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const { data } = await api.get<{ item: Item }>(`/public/services/${slug}`);
        setItem(data.item);
      } catch {
        setItem(null);
      }
    })();
  }, [slug]);

  if (!item) {
    return <p className="text-ink/70">Загрузка или услуга не найдена.</p>;
  }

  return (
    <>
      <Helmet>
        <title>{item.title}</title>
        <link rel="canonical" href={`${SITE_URL}/services/${item.slug}`} />
      </Helmet>
      <Link to="/services" className="text-sm text-sepia no-underline hover:underline">
        ← Все услуги
      </Link>
      <h1 className="mt-4 font-display text-4xl text-bistre">{item.title}</h1>
      <p className="mt-6 max-w-3xl leading-relaxed text-ink/85">{item.description}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Этапы выполнения</SectionLabel>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-ink/85">
            {item.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <SectionLabel>Документы от клиента</SectionLabel>
          <ul className="mt-4 space-y-2 text-sm text-ink/85">
            {item.documents.map((d, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-sepia">—</span>
                {d}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6">
        <SectionLabel>Сроки и стоимость</SectionLabel>
        {item.timelineNote && <p className="mt-3 text-sm text-ink/80">{item.timelineNote}</p>}
        {item.priceFromRub != null && (
          <p className="mt-4 text-lg font-medium text-bistre">
            Ориентировочная стоимость от {item.priceFromRub.toLocaleString("ru-RU")} ₽
          </p>
        )}
        <Link
          to={`/consultation?service=${encodeURIComponent(item.slug)}`}
          className="mt-6 inline-flex border border-umber bg-bistre px-6 py-2.5 text-sm font-medium text-cream no-underline hover:bg-ink"
        >
          Оставить заявку
        </Link>
      </Panel>
    </>
  );
}
