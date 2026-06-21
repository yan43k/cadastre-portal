import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, Shield } from "lucide-react";
import { SPECIALIST, OFFICIAL_STATUS } from "../content/specialist";
import { api } from "../api/client";
import { Panel, SectionLabel, StampRibbon } from "../components/Ui";
import { WorkTimeline } from "../components/WorkTimeline";
import { DocumentsArchive } from "../components/DocumentsArchive";
import { JsonLdLocalBusiness } from "../components/JsonLd";
import { SITE_URL } from "../config";

const HomeMapSection = lazy(() => import("../components/HomeMapSection"));

type ServiceCard = {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string | null;
  priceFromRub?: number | null;
};

export default function HomePage() {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [stats, setStats] = useState({
    applicationsTotal: "—",
    activeClients: "—",
    servicesPublished: "—",
  });
  const [slots, setSlots] = useState<{ start: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [s, sv, av] = await Promise.all([
          api.get("/public/stats"),
          api.get<{ items: ServiceCard[] }>("/public/services"),
          api.get<{ slots: { start: string }[] }>("/public/appointments/availability?days=14"),
        ]);
        setStats({
          applicationsTotal: String(s.data.applicationsTotal),
          activeClients: String(s.data.activeClients),
          servicesPublished: String(s.data.servicesPublished),
        });
        setServices(sv.data.items);
        setSlots(av.data.slots.slice(0, 4));
      } catch {
        /* offline */
      }
    })();
  }, []);

  return (
    <>
      <Helmet>
        <title>{SPECIALIST.fullName} — кадастровый инженер, Алтайский край</title>
        <meta
          name="description"
          content="Кадастровый инженер в Павловском районе: межевание, технические планы, постановка на учёт, консультации. Официальный стиль ведения дел."
        />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:title" content={`${SPECIALIST.fullName} — кадастровый инженер`} />
        <meta
          property="og:description"
          content="Кадастровые работы в Алтайском крае. Запись на консультацию и проверка статуса обращения."
        />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <JsonLdLocalBusiness />

      <div className="relative border-technical border border-line bg-cream/40 p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <StampRibbon>действующий специалист</StampRibbon>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-bistre sm:text-5xl">
              {SPECIALIST.fullName}
            </h1>
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink/85">
              {SPECIALIST.title}. Регистрационный номер кадастрового инженера{" "}
              <span className="whitespace-nowrap">{SPECIALIST.registryNumber}</span> с{" "}
              {SPECIALIST.registryRegisteredAt}. Регион профессиональной деятельности:{" "}
              {SPECIALIST.region}.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink/80">
              {SPECIALIST.directions.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-umber" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/consultation"
                className="inline-flex items-center gap-2 border border-umber bg-bistre px-5 py-2.5 text-sm font-medium text-cream no-underline transition hover:bg-ink"
              >
                Записаться на консультацию <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 border border-line bg-parchment px-5 py-2.5 text-sm font-medium text-bistre no-underline hover:border-umber"
              >
                Перечень услуг
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Panel>
                <SectionLabel>Служебная справка</SectionLabel>
                <p className="mt-3 font-display text-2xl text-bistre">Реквизиты для обращения</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4 border-b border-line/80 py-2">
                    <dt className="text-ink/65">ИНН ИП</dt>
                    <dd className="font-medium">{SPECIALIST.inn}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-line/80 py-2">
                    <dt className="text-ink/65">Телефон</dt>
                    <dd>
                      <a href="tel:+79039905136" className="no-underline">
                        {SPECIALIST.phone}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-ink/65">E-mail</dt>
                    <dd>
                      <a href={`mailto:${SPECIALIST.email}`} className="no-underline">
                        {SPECIALIST.email}
                      </a>
                    </dd>
                  </div>
                </dl>
              </Panel>
            </motion.div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Panel className="py-4">
                <p className="font-display text-2xl text-bistre">{stats.applicationsTotal}</p>
                <p className="mt-1 text-xs text-ink/60">обращений в учёте</p>
              </Panel>
              <Panel className="py-4">
                <p className="font-display text-2xl text-bistre">{stats.servicesPublished}</p>
                <p className="mt-1 text-xs text-ink/60">направлений</p>
              </Panel>
              <Panel className="py-4">
                <p className="font-display text-2xl text-bistre">{stats.activeClients}</p>
                <p className="mt-1 text-xs text-ink/60">клиентов</p>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel className="bg-bistre text-cream">
            <div className="flex items-start gap-3">
              <Shield className="mt-1 h-6 w-6 shrink-0 text-sand" />
              <div>
                <SectionLabel className="!text-sand/90">Официальный статус</SectionLabel>
                <p className="mt-3 font-display text-2xl">Документальная прозрачность</p>
                <p className="mt-2 text-sm leading-relaxed text-cream/85">
                  Ниже приведены ключевые сведения, подтверждающие правовой статус и организацию
                  профессиональной деятельности.
                </p>
              </div>
            </div>
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2">
            {OFFICIAL_STATUS.map((row) => (
              <Panel key={row.label} className="!bg-cream/90">
                <p className="text-sm font-semibold text-bistre">{row.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink/75">{row.detail}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <SectionLabel>Услуги</SectionLabel>
        <h2 className="mt-2 font-display text-3xl text-bistre">Основные направления</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Panel className="h-full">
                <Link to={`/services/${s.slug}`} className="font-display text-lg font-semibold text-bistre no-underline">
                  {s.title}
                </Link>
                {s.shortDesc && <p className="mt-2 text-sm text-ink/80">{s.shortDesc}</p>}
                {s.priceFromRub != null && (
                  <p className="mt-4 text-xs text-sepia">
                    Ориентир от {s.priceFromRub.toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </Panel>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionLabel>Этапы работы</SectionLabel>
          <h2 className="mt-2 font-display text-3xl text-bistre">Регламент взаимодействия</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/80">
            Последовательность этапов может корректироваться в зависимости от основания обращения и состава
            документов. Фактические сроки фиксируются в договоре.
          </p>
          <div className="mt-8">
            <WorkTimeline />
          </div>
        </div>
        <div className="space-y-6">
          <Suspense
            fallback={<Panel className="h-[360px] animate-pulse bg-cream/60">Загрузка карты…</Panel>}
          >
            <HomeMapSection />
          </Suspense>
          <Panel>
            <SectionLabel>Запись</SectionLabel>
            <p className="mt-2 font-display text-xl text-bistre">Ближайшие интервалы</p>
            <ul className="mt-4 space-y-2 text-sm">
              {slots.length === 0 && <li className="text-ink/60">Данные загружаются…</li>}
              {slots.map((sl) => (
                <li key={sl.start} className="flex justify-between border-b border-line/70 py-2 last:border-0">
                  <span>
                    {new Date(sl.start).toLocaleString("ru-RU", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Link to="/consultation" className="text-xs font-medium">
                    Запросить
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      <section className="mt-16">
        <SectionLabel>Документы и квалификация</SectionLabel>
        <h2 className="mt-2 font-display text-3xl text-bistre">Открытый архив</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/80">
          Подборка обезличенных образцов и подтверждающих документов. Доступ к полным копиям предоставляется
          контрагентам в рамках договорных отношений.
        </p>
        <div className="mt-8">
          <DocumentsArchive limit={6} />
        </div>
      </section>
    </>
  );
}
