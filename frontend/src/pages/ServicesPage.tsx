import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type S = {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string | null;
  priceFromRub?: number | null;
  timelineNote?: string | null;
};

export default function ServicesPage() {
  const [items, setItems] = useState<S[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: S[] }>("/public/services");
        setItems(data.items);
      } catch {
        /* */
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>Услуги кадастрового инженера</title>
        <link rel="canonical" href={`${SITE_URL}/services`} />
      </Helmet>
      <SectionLabel>Перечень</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Услуги</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Описание носит информационный характер. Итоговая стоимость и срок зависят от объёма работ и
        полноты представленных документов.
      </p>
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {items.map((s) => (
          <Panel key={s.id}>
            <Link
              to={`/services/${s.slug}`}
              className="font-display text-xl font-semibold text-bistre no-underline"
            >
              {s.title}
            </Link>
            {s.shortDesc && <p className="mt-3 text-sm text-ink/80">{s.shortDesc}</p>}
            {s.timelineNote && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-sepia">{s.timelineNote}</p>
            )}
            {s.priceFromRub != null && (
              <p className="mt-2 text-sm font-medium text-bistre">
                Ориентировочно от {s.priceFromRub.toLocaleString("ru-RU")} ₽
              </p>
            )}
            <Link
              to={`/consultation?service=${encodeURIComponent(s.slug)}`}
              className="mt-4 inline-block text-sm font-medium"
            >
              Оставить заявку
            </Link>
          </Panel>
        ))}
      </div>
    </>
  );
}
