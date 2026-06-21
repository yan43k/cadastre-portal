import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { SPECIALIST } from "../content/specialist";
import { Panel, SectionLabel } from "../components/Ui";
import { api } from "../api/client";
import { SITE_URL } from "../config";

type Q = {
  id: string;
  title: string;
  org: string | null;
  year: number | null;
  description: string | null;
};

export default function AboutPage() {
  const [rows, setRows] = useState<Q[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: Q[] }>("/public/qualifications");
        setRows(data.items);
      } catch {
        /* */
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>О специалисте — {SPECIALIST.fullName}</title>
        <meta
          name="description"
          content="Реквизиты кадастрового инженера, образование, регистрация в реестре, контакты в Павловском районе."
        />
        <link rel="canonical" href={`${SITE_URL}/about`} />
      </Helmet>

      <div className="max-w-4xl">
        <SectionLabel>Личное досье</SectionLabel>
        <h1 className="mt-2 font-display text-4xl text-bistre">{SPECIALIST.fullName}</h1>
        <p className="mt-4 text-ink/85">{SPECIALIST.title}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Реестр кадастровых инженеров</SectionLabel>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink/65">Регистрационный номер</dt>
              <dd className="font-medium">{SPECIALIST.registryNumber}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink/65">Дата регистрации в реестре</dt>
              <dd>{SPECIALIST.registryRegisteredAt}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink/65">Регион деятельности</dt>
              <dd className="text-right">{SPECIALIST.region}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <SectionLabel>Индивидуальный предприниматель</SectionLabel>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink/65">ИНН</dt>
              <dd className="font-medium">{SPECIALIST.inn}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink/65">Дата регистрации ИП</dt>
              <dd>{SPECIALIST.ipRegisteredAt}</dd>
            </div>
            <div className="py-2">
              <dt className="text-ink/65">Адрес места деятельности</dt>
              <dd className="mt-2 leading-relaxed">{SPECIALIST.address}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel className="mt-6">
        <SectionLabel>Контакты</SectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-ink/65">Телефон</p>
            <a href="tel:+79039905136" className="mt-1 block text-lg font-medium text-bistre no-underline">
              {SPECIALIST.phone}
            </a>
          </div>
          <div>
            <p className="text-ink/65">Электронная почта</p>
            <a href={`mailto:${SPECIALIST.email}`} className="mt-1 block text-lg no-underline">
              {SPECIALIST.email}
            </a>
          </div>
        </div>
      </Panel>

      <section className="mt-14">
        <SectionLabel>Образование и квалификация</SectionLabel>
        <h2 className="mt-2 font-display text-3xl text-bistre">Архив сведений</h2>
        <div className="mt-8 space-y-4">
          {rows.map((r, i) => (
            <Panel
              key={r.id}
              className="relative border-dashed border-umber/30 bg-parchment/80"
            >
              <span className="absolute right-4 top-4 font-mono text-xs text-ink/40">
                № {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-display text-xl text-bistre">{r.title}</p>
              {r.org && <p className="mt-2 text-sm text-sepia">{r.org}</p>}
              {r.year && <p className="mt-1 text-xs text-ink/55">Год: {r.year}</p>}
              {r.description && <p className="mt-3 text-sm leading-relaxed text-ink/80">{r.description}</p>}
            </Panel>
          ))}
        </div>
      </section>
    </>
  );
}
