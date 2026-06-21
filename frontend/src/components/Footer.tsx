import { Link } from "react-router-dom";
import { SPECIALIST } from "../content/specialist";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-cream/50 px-4 py-10 sm:px-8 lg:px-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-bistre">{SPECIALIST.fullName}</p>
          <p className="mt-2 text-sm text-ink/75">{SPECIALIST.title}</p>
          <p className="mt-1 text-xs text-ink/60">Регистрационный номер {SPECIALIST.registryNumber}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-bistre">Приём обращений</p>
          <p className="mt-2">
            <a href={`mailto:${SPECIALIST.email}`}>{SPECIALIST.email}</a>
          </p>
          <p className="mt-1">
            <a href="tel:+79039905136">{SPECIALIST.phone}</a>
          </p>
        </div>
        <div className="text-sm text-ink/75">
          <p>
            <Link to="/privacy" className="no-underline hover:underline">
              Политика конфиденциальности
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/cabinet" className="no-underline hover:underline">
              Личный кабинет клиента
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
