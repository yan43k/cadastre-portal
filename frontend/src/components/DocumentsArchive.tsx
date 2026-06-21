import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { api } from "../api/client";
import { Panel, StampRibbon } from "./Ui";

type Doc = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
};

export function DocumentsArchive({ limit }: { limit?: number }) {
  const [items, setItems] = useState<Doc[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: Doc[] }>("/public/documents");
        setItems(limit ? data.items.slice(0, limit) : data.items);
      } catch {
        /* offline */
      }
    })();
  }, [limit]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((d) => (
        <Panel key={d.id} className="relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-30">
            <FileText className="h-16 w-16 text-sepia" aria-hidden />
          </div>
          <StampRibbon className="mb-3">архив</StampRibbon>
          <p className="text-xs uppercase tracking-widest text-sepia">{d.kind}</p>
          <p className="mt-2 font-display text-lg font-semibold text-bistre">{d.title}</p>
          {d.description && <p className="mt-2 text-sm text-ink/80">{d.description}</p>}
          <a
            href={`/api/public/documents/${d.id}/file`}
            className="mt-4 inline-block text-sm font-medium no-underline"
          >
            Открыть PDF
          </a>
        </Panel>
      ))}
    </div>
  );
}
