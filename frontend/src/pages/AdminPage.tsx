import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";

type Tab = "dash" | "apps" | "services" | "news" | "reviews" | "vac" | "appt";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dash");
  const [dash, setDash] = useState<unknown>(null);
  const [apps, setApps] = useState<
    { id: string; publicNumber: string; statusLabel: string; contactName: string }[]
  >([]);
  const [reviews, setReviews] = useState<{ id: string; authorName: string; published: boolean }[]>(
    []
  );

  useEffect(() => {
    void (async () => {
      try {
        if (tab === "dash") {
          const { data } = await api.get("/admin/dashboard");
          setDash(data);
        }
        if (tab === "apps") {
          const { data } = await api.get("/admin/applications?pageSize=50");
          setApps(data.items);
        }
        if (tab === "reviews") {
          const { data } = await api.get("/admin/reviews?pageSize=50");
          setReviews(data.items);
        }
      } catch {
        toast.error("Ошибка загрузки админ-данных");
      }
    })();
  }, [tab]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/applications/${id}`, { status });
      toast.success("Статус обновлён");
      const { data } = await api.get("/admin/applications?pageSize=50");
      setApps(data.items);
    } catch {
      toast.error("Не удалось обновить");
    }
  };

  const toggleReview = async (id: string, published: boolean) => {
    await api.patch(`/admin/reviews/${id}`, { published });
    const { data } = await api.get("/admin/reviews?pageSize=50");
    setReviews(data.items);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "dash", label: "Сводка" },
    { id: "apps", label: "Заявки" },
    { id: "services", label: "Услуги (API)" },
    { id: "news", label: "Новости" },
    { id: "reviews", label: "Отзывы" },
    { id: "vac", label: "Отклики" },
    { id: "appt", label: "Записи" },
  ];

  return (
    <>
      <Helmet>
        <title>Административная панель</title>
      </Helmet>
      <SectionLabel>Ограниченный доступ</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Администрирование</h1>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border px-3 py-1.5 text-sm ${
              tab === t.id ? "border-umber bg-cream" : "border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dash" && (
        <Panel className="mt-6">
          <pre className="overflow-auto text-xs">{JSON.stringify(dash, null, 2)}</pre>
        </Panel>
      )}

      {tab === "apps" && (
        <div className="mt-6 space-y-3">
          {apps.map((a) => (
            <Panel key={a.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-semibold">{a.publicNumber}</span> — {a.contactName}
                <p className="text-sepia">{a.statusLabel}</p>
              </div>
              <select
                className="border border-line bg-parchment px-2 py-1 text-xs"
                onChange={(e) => void setStatus(a.id, e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Сменить статус…
                </option>
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DOCS">DOCS</option>
                <option value="REVIEW">REVIEW</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </Panel>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-6 space-y-2">
          {reviews.map((r) => (
            <Panel key={r.id} className="flex items-center justify-between text-sm">
              <span>
                {r.authorName} {r.published ? "(опубл.)" : "(модерация)"}
              </span>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => void toggleReview(r.id, !r.published)}
              >
                {r.published ? "Снять" : "Опубликовать"}
              </button>
            </Panel>
          ))}
        </div>
      )}

      {tab === "services" && (
        <p className="mt-6 text-sm text-ink/75">
          CRUD услуг доступен через <code className="text-xs">GET/POST/PATCH /api/admin/services</code> —
          используйте внешний REST-клиент или расширьте эту панель при необходимости.
        </p>
      )}
      {tab === "news" && (
        <p className="mt-6 text-sm text-ink/75">
          Управление новостями: <code>/api/admin/news</code>.
        </p>
      )}
      {tab === "vac" && (
        <p className="mt-6 text-sm text-ink/75">
          Отклики: <code>/api/admin/vacancy-applications</code>.
        </p>
      )}
      {tab === "appt" && (
        <p className="mt-6 text-sm text-ink/75">
          Записи на консультации: <code>/api/admin/appointments</code>.
        </p>
      )}
    </>
  );
}
