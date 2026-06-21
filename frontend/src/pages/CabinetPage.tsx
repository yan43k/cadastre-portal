import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Panel, SectionLabel } from "../components/Ui";

type AppRow = {
  id: string;
  publicNumber: string;
  statusLabel: string;
  createdAt: string;
  messagesCount: number;
};

type Msg = { id: string; authorRole: string; body: string; createdAt: string };

export default function CabinetPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body: string; read: boolean; createdAt: string }[]
  >([]);

  const load = async () => {
    const { data } = await api.get<{ items: AppRow[] }>("/client/applications");
    setApps(data.items);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
        const n = await api.get<{
          items: { id: string; title: string; body: string; read: boolean; createdAt: string }[];
        }>("/client/notifications");
        setNotifications(n.data.items);
      } catch {
        toast.error("Не удалось загрузить данные");
      }
    })();
  }, []);

  useEffect(() => {
    if (!sel) return;
    void (async () => {
      const { data } = await api.get<{ items: Msg[] }>(`/client/applications/${sel}/messages`);
      setMsgs(data.items);
    })();
  }, [sel]);

  const sendMsg = async () => {
    if (!sel || !note.trim()) return;
    try {
      await api.post(`/client/applications/${sel}/messages`, { body: note });
      setNote("");
      const { data } = await api.get<{ items: Msg[] }>(`/client/applications/${sel}/messages`);
      setMsgs(data.items);
    } catch {
      toast.error("Ошибка отправки");
    }
  };

  const upload = async () => {
    if (!sel || !fileRef.current?.files?.[0]) return;
    const fd = new FormData();
    fd.append("file", fileRef.current.files[0]);
    try {
      await api.post(`/client/applications/${sel}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Файл добавлен");
      await load();
    } catch {
      toast.error("Ошибка загрузки");
    }
  };

  return (
    <>
      <Helmet>
        <title>Личный кабинет клиента</title>
      </Helmet>
      <SectionLabel>Клиентский раздел</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Личный кабинет</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-display text-xl text-bistre">Уведомления</h2>
          <div className="mt-3 space-y-2">
            {notifications.slice(0, 8).map((n) => (
              <Panel key={n.id} className={`py-3 text-sm ${n.read ? "opacity-70" : ""}`}>
                <p className="font-medium">{n.title}</p>
                <p className="text-ink/75">{n.body}</p>
                <p className="mt-1 text-xs text-sepia">
                  {new Date(n.createdAt).toLocaleString("ru-RU")}
                </p>
              </Panel>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl text-bistre">Обращения</h2>
          <div className="mt-3 space-y-2">
            {apps.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSel(a.id)}
                className={`w-full border px-4 py-3 text-left text-sm ${
                  sel === a.id ? "border-umber bg-cream" : "border-line"
                }`}
              >
                <span className="font-semibold">{a.publicNumber}</span> — {a.statusLabel}
                <span className="ml-2 text-xs text-sepia">сообщ.: {a.messagesCount}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {sel && (
        <Panel className="mt-8">
          <h3 className="font-display text-xl text-bistre">Переписка по делу</h3>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto border border-line bg-parchment/50 p-3">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`text-sm ${m.authorRole === "ADMIN" ? "text-bistre" : "text-ink"}`}
              >
                <span className="text-xs text-sepia">
                  {m.authorRole} · {new Date(m.createdAt).toLocaleString("ru-RU")}
                </span>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-3 w-full border border-line bg-parchment px-3 py-2 text-sm"
            placeholder="Ваше сообщение"
          />
          <button
            type="button"
            onClick={() => void sendMsg()}
            className="mt-2 border border-umber bg-bistre px-4 py-2 text-sm text-cream"
          >
            Отправить
          </button>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-medium">Загрузка документа</p>
            <input ref={fileRef} type="file" className="mt-2 text-sm" />
            <button
              type="button"
              onClick={() => void upload()}
              className="mt-2 border border-line px-4 py-2 text-sm"
            >
              Загрузить
            </button>
          </div>
        </Panel>
      )}
    </>
  );
}
