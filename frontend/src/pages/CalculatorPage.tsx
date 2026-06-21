import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type Rules = Record<string, number>;

export default function CalculatorPage() {
  const [rules, setRules] = useState<Rules>({});
  const [objectType, setObjectType] = useState<"zu" | "oks" | "kv">("zu");
  const [area, setArea] = useState(10);
  const [district, setDistrict] = useState<"pavlovsky" | "remote">("pavlovsky");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: { key: string; value: string }[] }>(
          "/public/pricing-rules"
        );
        const r: Rules = {};
        for (const row of data.items) {
          r[row.key] = Number(row.value);
        }
        setRules(r);
      } catch {
        /* */
      }
    })();
  }, []);

  const estimate = useMemo(() => {
    const base = rules.base_per_sotka ?? 1800;
    const objKey =
      objectType === "zu" ? "object_zu" : objectType === "oks" ? "object_oks" : "object_kv";
    const obj = rules[objKey] ?? 1;
    const dist =
      district === "pavlovsky"
        ? (rules.district_factor_pavlovsky ?? 1)
        : (rules.district_factor_remote ?? 1.25);
    const urg = urgent ? (rules.urgent_factor ?? 1.35) : 1;
    const sotka = area;
    return Math.round(base * sotka * obj * dist * urg);
  }, [rules, objectType, area, district, urgent]);

  return (
    <>
      <Helmet>
        <title>Кадастровый калькулятор (ориентир)</title>
        <link rel="canonical" href={`${SITE_URL}/calculator`} />
      </Helmet>
      <SectionLabel>Инструмент</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Калькулятор ориентировочной стоимости</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Расчёт является предварительным и не заменяет коммерческое предложение. Коэффициенты задаются в
        административной панели и могут обновляться.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Panel className="space-y-4">
          <div>
            <label className="text-xs uppercase text-sepia">Тип объекта</label>
            <select
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              value={objectType}
              onChange={(e) => setObjectType(e.target.value as typeof objectType)}
            >
              <option value="zu">Земельный участок</option>
              <option value="oks">Объект капитального строительства</option>
              <option value="kv">Помещение</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Площадь, соток (условных единиц)</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Местоположение</label>
            <select
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              value={district}
              onChange={(e) => setDistrict(e.target.value as typeof district)}
            >
              <option value="pavlovsky">Павловский район / близкий выезд</option>
              <option value="remote">Удалённые населённые пункты региона</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            Повышенная срочность
          </label>
        </Panel>
        <Panel>
          <SectionLabel>Результат</SectionLabel>
          <p className="mt-6 font-display text-4xl text-bistre">
            ≈ {estimate.toLocaleString("ru-RU")} ₽
          </p>
          <p className="mt-4 text-xs text-ink/65">
            База: {rules.base_per_sotka ?? "—"} ₽ × единица площади, с коэффициентами по типу объекта,
            удалённости и срочности.
          </p>
        </Panel>
      </div>
    </>
  );
}
