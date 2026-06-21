import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { API_BASE } from "../config";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type N = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  filePath: string | null;
};

export default function NormativesPage() {
  const [cat, setCat] = useState<string>("");
  const [items, setItems] = useState<N[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: N[] }>(
          cat ? `/public/normatives?category=${encodeURIComponent(cat)}` : "/public/normatives"
        );
        setItems(data.items);
      } catch {
        /* */
      }
    })();
  }, [cat]);

  return (
    <>
      <Helmet>
        <title>Нормативные документы</title>
        <link rel="canonical" href={`${SITE_URL}/normatives`} />
      </Helmet>
      <SectionLabel>Архив</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Нормативная база</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Подборка ссылок на официальные источники и демонстрационные материалы. Актуальность редакций
        уточняйте на правовых системах.
      </p>
      <div className="mt-6">
        <label className="text-xs uppercase text-sepia">Категория</label>
        <select
          className="mt-1 border border-line bg-parchment px-3 py-2 text-sm"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">Все</option>
          <option value="FEDERAL">Федеральные законы</option>
          <option value="CADASTRE">Кадастровые акты</option>
          <option value="SAMPLE">Образцы</option>
        </select>
      </div>
      <div className="mt-8 space-y-4">
        {items.map((n) => (
          <Panel key={n.id}>
            <p className="text-xs uppercase text-sepia">{n.category}</p>
            <p className="mt-2 font-display text-xl text-bistre">{n.title}</p>
            {n.description && <p className="mt-2 text-sm text-ink/80">{n.description}</p>}
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {n.externalUrl && (
                <a href={n.externalUrl} target="_blank" rel="noreferrer" className="font-medium">
                  Внешняя ссылка
                </a>
              )}
              {n.filePath && (
                <a href={`${API_BASE}/public/normatives/${n.id}/file`} className="font-medium">
                  Локальный файл
                </a>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
