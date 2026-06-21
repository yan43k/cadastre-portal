import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { Footer } from "./Footer";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/", label: "Главная" },
  { to: "/about", label: "О специалисте" },
  { to: "/services", label: "Услуги" },
  { to: "/consultation", label: "Обращение" },
  { to: "/track", label: "Проверка статуса" },
  { to: "/calculator", label: "Калькулятор" },
  { to: "/normatives", label: "Нормативы" },
  { to: "/partners", label: "Партнёры" },
  { to: "/vacancies", label: "Вакансии" },
  { to: "/news", label: "Новости" },
  { to: "/privacy", label: "Конфиденциальность" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "block border-l-2 px-3 py-2 text-sm transition-colors",
    isActive
      ? "border-umber bg-cream/80 font-semibold text-bistre"
      : "border-transparent text-ink/85 hover:border-line hover:bg-cream/50"
  );

export function AppShell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="relative hidden w-64 shrink-0 border-r border-line bg-cream/60 lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-4 pb-8 pt-10">
            <div className="border-b border-line pb-6">
              <p className="font-display text-xl font-semibold leading-tight text-bistre">
                Кадастровые работы
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink/70">
                ИП · Павловский район
                <br />
                Алтайский край
              </p>
            </div>
            <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto font-body">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/"}>
                  {l.label}
                </NavLink>
              ))}
              <div className="my-3 border-t border-line" />
              {!user && (
                <NavLink to="/login" className={linkClass}>
                  Вход в кабинет
                </NavLink>
              )}
              {user?.role === "CLIENT" && (
                <NavLink to="/cabinet" className={linkClass}>
                  Личный кабинет
                </NavLink>
              )}
              {user?.role === "ADMIN" && (
                <NavLink to="/admin" className={linkClass}>
                  Админ-панель
                </NavLink>
              )}
              {user && (
                <button
                  type="button"
                  className="mt-2 w-full border-l-2 border-transparent px-3 py-2 text-left text-sm text-sepia hover:bg-cream/50"
                  onClick={() => logout()}
                >
                  Выйти
                </button>
              )}
            </nav>
            <div className="mt-6 border-t border-line pt-4 text-xs text-ink/65">
              <p>Контактный телефон</p>
              <a href="tel:+79039905136" className="mt-1 block text-sm font-medium text-bistre no-underline">
                8 (903) 990-51-36
              </a>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-line bg-parchment/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-bistre">Кадастровый инженер</p>
              <button
                type="button"
                className="rounded border border-line p-2 text-bistre"
                aria-label={open ? "Закрыть меню" : "Открыть меню"}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            {open && (
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-1 border-t border-line pt-3"
              >
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                    end={l.to === "/"}
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="my-2 border-t border-line" />
                {!user && (
                  <NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>
                    Вход в кабинет
                  </NavLink>
                )}
                {user?.role === "CLIENT" && (
                  <NavLink to="/cabinet" onClick={() => setOpen(false)} className={linkClass}>
                    Личный кабинет
                  </NavLink>
                )}
                {user?.role === "ADMIN" && (
                  <NavLink to="/admin" onClick={() => setOpen(false)} className={linkClass}>
                    Админ-панель
                  </NavLink>
                )}
              </motion.nav>
            )}
          </header>

          <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
