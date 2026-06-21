import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";
import { Link } from "react-router-dom";

const schema = z.object({
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  serviceSlug: z.string().optional(),
  requestType: z.enum(["CONSULTATION", "REQUEST", "CALLBACK"]),
  message: z.string().optional(),
  preferredDate: z.string().optional(),
  priority: z.enum(["NORMAL", "URGENT"]).optional(),
  consent: z.boolean().refine((v) => v === true, "Требуется согласие"),
});

type FormValues = z.infer<typeof schema>;

export default function ConsultationPage() {
  const [sp] = useSearchParams();
  const servicePref = sp.get("service") ?? "";
  const filesRef = useRef<HTMLInputElement | null>(null);
  const [done, setDone] = useState<{ publicNumber: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceSlug: servicePref || undefined,
      requestType: "CONSULTATION",
      priority: "NORMAL",
      consent: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("contactName", values.contactName);
    fd.append("contactEmail", values.contactEmail);
    if (values.contactPhone) fd.append("contactPhone", values.contactPhone);
    if (values.serviceSlug) fd.append("serviceSlug", values.serviceSlug);
    fd.append("requestType", values.requestType);
    if (values.message) fd.append("message", values.message);
    if (values.preferredDate) fd.append("preferredDate", values.preferredDate);
    if (values.priority) fd.append("priority", values.priority);
    const fl = filesRef.current?.files;
    if (fl) {
      for (let i = 0; i < fl.length; i++) {
        fd.append("files", fl[i]!);
      }
    }
    try {
      const { data } = await api.post<{ publicNumber: string }>("/public/applications", fd);
      setDone({ publicNumber: data.publicNumber });
      toast.success("Обращение зарегистрировано");
    } catch {
      toast.error("Не удалось отправить форму");
    }
  };

  return (
    <>
      <Helmet>
        <title>Обращение и запись на консультацию</title>
        <link rel="canonical" href={`${SITE_URL}/consultation`} />
      </Helmet>
      <SectionLabel>Обращение</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">
        Заявка, запись на консультацию, заказ звонка
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Заполните поля ниже. Нажимая «Отправить», вы подтверждаете согласие на обработку персональных
        данных в соответствии с{" "}
        <Link to="/privacy" className="font-medium">
          политикой конфиденциальности
        </Link>
        .
      </p>

      {done ? (
        <Panel className="mt-8 max-w-xl border-umber/40 bg-cream">
          <p className="font-display text-2xl text-bistre">Обращение принято</p>
          <p className="mt-3 text-sm">
            Номер: <span className="font-semibold">{done.publicNumber}</span>
          </p>
          <p className="mt-2 text-sm text-ink/75">
            Статус можно проверить в разделе{" "}
            <Link to="/track">«Проверка готовности»</Link>.
          </p>
        </Panel>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-xl space-y-4">
          <div>
            <label className="text-xs uppercase text-sepia">ФИО</label>
            <input
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              {...register("contactName")}
            />
            {errors.contactName && <p className="mt-1 text-xs text-red-700">{errors.contactName.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase text-sepia">Email</label>
              <input
                type="email"
                className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-700">{errors.contactEmail.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase text-sepia">Телефон</label>
              <input
                className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
                {...register("contactPhone")}
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Тип обращения</label>
            <select
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              {...register("requestType")}
            >
              <option value="CONSULTATION">Консультация</option>
              <option value="REQUEST">Заявка на работы</option>
              <option value="CALLBACK">Заказ звонка</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Услуга (slug, опционально)</label>
            <input
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              placeholder="например mezhevanie"
              {...register("serviceSlug")}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Сообщение</label>
            <textarea
              rows={4}
              className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
              {...register("message")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase text-sepia">Предпочтительная дата</label>
              <input
                type="date"
                className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
                {...register("preferredDate")}
              />
            </div>
            <div>
              <label className="text-xs uppercase text-sepia">Срочность</label>
              <select
                className="mt-1 w-full border border-line bg-parchment px-3 py-2 text-sm"
                {...register("priority")}
              >
                <option value="NORMAL">Обычная</option>
                <option value="URGENT">Повышенная</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-sepia">Вложения</label>
            <input ref={filesRef} type="file" multiple className="mt-1 w-full text-sm" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...register("consent")} className="mt-1" />
            <span>Согласен(на) на обработку персональных данных</span>
          </label>
          {errors.consent && <p className="text-xs text-red-700">Требуется согласие</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-umber bg-bistre px-8 py-2.5 text-sm font-medium text-cream disabled:opacity-50"
          >
            Отправить
          </button>
        </form>
      )}
    </>
  );
}
