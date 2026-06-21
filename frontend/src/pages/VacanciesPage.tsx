import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

type Vacancy = { id: string; title: string; description: string; requirements: string };

const applySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export default function VacanciesPage() {
  const [items, setItems] = useState<Vacancy[]>([]);
  const [sel, setSel] = useState<string>("");

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<{ items: Vacancy[] }>("/public/vacancies");
        setItems(data.items);
        if (data.items[0]) setSel(data.items[0].id);
      } catch {
        /* */
      }
    })();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = async (v: z.infer<typeof applySchema>) => {
    if (!sel) return;
    try {
      await api.post("/public/vacancy-applications", { ...v, vacancyId: sel });
      toast.success("Отклик отправлен");
    } catch {
      toast.error("Ошибка отправки");
    }
  };

  const v = items.find((x) => x.id === sel) ?? items[0];

  return (
    <>
      <Helmet>
        <title>Вакансии и стажировка</title>
        <link rel="canonical" href={`${SITE_URL}/vacancies`} />
      </Helmet>
      <SectionLabel>Кадры</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Вакансии и стажировка</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Рассматриваются отклики кандидатов с профильным образованием и ответственным подходом к
        документации.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setSel(it.id)}
              className={`w-full border px-4 py-3 text-left text-sm transition ${
                sel === it.id ? "border-umber bg-cream" : "border-line bg-parchment/60"
              }`}
            >
              {it.title}
            </button>
          ))}
        </div>
        {v && (
          <Panel>
            <p className="font-display text-2xl text-bistre">{v.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink/85">{v.description}</p>
            <SectionLabel className="mt-6">Требования</SectionLabel>
            <p className="mt-2 text-sm text-ink/85">{v.requirements}</p>
          </Panel>
        )}
      </div>
      {v && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 max-w-xl space-y-3 border-t border-line pt-8">
          <h2 className="font-display text-2xl text-bistre">Форма отклика</h2>
          <div>
            <input
              placeholder="ФИО"
              className="w-full border border-line bg-parchment px-3 py-2 text-sm"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-700">{errors.name.message}</p>}
          </div>
          <div>
            <input
              placeholder="Email"
              type="email"
              className="w-full border border-line bg-parchment px-3 py-2 text-sm"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
          </div>
          <input
            placeholder="Телефон"
            className="w-full border border-line bg-parchment px-3 py-2 text-sm"
            {...register("phone")}
          />
          <textarea
            placeholder="Сопроводительное письмо"
            rows={4}
            className="w-full border border-line bg-parchment px-3 py-2 text-sm"
            {...register("message")}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-umber bg-bistre px-6 py-2 text-sm text-cream disabled:opacity-50"
          >
            Отправить отклик
          </button>
        </form>
      )}
    </>
  );
}
