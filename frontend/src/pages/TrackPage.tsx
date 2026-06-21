import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

export default function TrackPage() {
  const [num, setNum] = useState("");
  const [res, setRes] = useState<{
    publicNumber: string;
    statusLabel: string;
    updatedAt: string;
  } | null>(null);
  const [err, setErr] = useState("");

  const check = async () => {
    setErr("");
    setRes(null);
    try {
      const enc = encodeURIComponent(num.trim());
      const { data } = await api.get<{
        item: {
          publicNumber: string;
          statusLabel: string;
          updatedAt: string;
        };
      }>(`/public/applications/${enc}`);
      setRes({
        publicNumber: data.item.publicNumber,
        statusLabel: data.item.statusLabel,
        updatedAt: data.item.updatedAt,
      });
    } catch {
      setErr("Обращение не найдено. Проверьте номер.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Проверка статуса обращения</title>
        <link rel="canonical" href={`${SITE_URL}/track`} />
      </Helmet>
      <SectionLabel>Государственный стиль контроля</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Проверка готовности документов</h1>
      <p className="mt-4 max-w-xl text-sm text-ink/80">
        Укажите номер обращения в формате, который был направлен на электронную почту после регистрации.
      </p>
      <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="ПК-2026-00001"
          className="flex-1 border border-line bg-parchment px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void check()}
          className="border border-umber bg-bistre px-6 py-2 text-sm font-medium text-cream"
        >
          Проверить
        </button>
      </div>
      {err && <p className="mt-4 text-sm text-red-800">{err}</p>}
      {res && (
        <Panel className="mt-6 max-w-xl">
          <p className="text-xs uppercase text-sepia">Результат</p>
          <p className="mt-2 font-display text-2xl text-bistre">{res.publicNumber}</p>
          <p className="mt-4 text-sm">
            Статус: <span className="font-semibold">{res.statusLabel}</span>
          </p>
          <p className="mt-2 text-xs text-ink/60">
            Обновлено: {new Date(res.updatedAt).toLocaleString("ru-RU")}
          </p>
        </Panel>
      )}
    </>
  );
}
