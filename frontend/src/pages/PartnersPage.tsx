import { Helmet } from "react-helmet-async";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

const partners = [
  {
    name: "Росреестр / Федеральная служба государственной регистрации",
    role:
      "Взаимодействие в части подачи документов для кадастрового учёта и регистрации прав в рамках установленных процедур.",
  },
  {
    name: "Юридические компании региона",
    role:
      "Корреспонденция по сделкам, согласованию проектов договоров и сопровождению регистрационных действий.",
  },
  {
    name: "Оценочные организации",
    role: "Согласование исходных данных для объектов, требующих определения рыночной или иной стоимости.",
  },
  {
    name: "Строительные и проектные организации",
    role:
      "Получение исполнительной документации, обследования объектов, согласование координатной основы.",
  },
];

export default function PartnersPage() {
  return (
    <>
      <Helmet>
        <title>Партнёрские направления</title>
        <link rel="canonical" href={`${SITE_URL}/partners`} />
      </Helmet>
      <SectionLabel>Взаимодействие</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Партнёры и контрагенты</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Перечень характеризует профильные направления кооперации. Указание организаций не означает
        формального агентского договора с каждой из них; конкретные проекты согласуются отдельно.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {partners.map((p) => (
          <Panel key={p.name}>
            <div className="flex h-12 w-12 items-center justify-center border-2 border-dashed border-line text-xs text-sepia">
              логотип
            </div>
            <p className="mt-4 font-display text-xl text-bistre">{p.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{p.role}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
