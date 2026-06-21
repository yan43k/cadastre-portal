/* eslint-disable no-console */
import "dotenv/config";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

function demoPdfBytes() {
  const minimal = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
trailer<</Size 4/Root 1 0 R>>
startxref
100
%%EOF
`;
  return Buffer.from(minimal, "utf8");
}

function serviceData() {
  const mk = (
    slug: string,
    title: string,
    short: string,
    desc: string,
    steps: string[],
    docs: string[],
    timeline: string,
    price: number,
    order: number
  ) => ({
    slug,
    title,
    shortDesc: short,
    description: desc,
    stepsJson: JSON.stringify(steps),
    documentsJson: JSON.stringify(docs),
    timelineNote: timeline,
    priceFromRub: price,
    sortOrder: order,
    isActive: true,
  });

  return [
    mk(
      "mezhevanie",
      "Межевание земельных участков",
      "Подготовка межевого дела и сведений для ФГИС ЕГРН в отношении границ участка.",
      "Выполняются камеральные и полевые работы, согласование с соседями (при необходимости), формирование структуры документов по действующим требованиям. Сроки зависят от объёма исходных данных и сложности границ.",
      [
        "Анализ правоустанавливающих документов и материалов предыдущих работ",
        "Сбор исходной геодезической информации и сведений ЕГРН",
        "Полевые измерения и построение границ на местности",
        "Подготовка межевого плана и сопутствующих материалов",
        "Передача результата и сопровождение постановки сведений на учёт",
      ],
      [
        "Паспортные данные правообладателя",
        "Выписка из ЕГРН / кадастровый паспорт (при наличии)",
        "Документы, подтверждающие права на земельный участок",
        "Согласия соседей — по результатам анализа ситуации",
      ],
      "Ориентировочно 14–45 рабочих дней в зависимости от объекта и полноты исходных данных.",
      45000,
      10
    ),
    mk(
      "tehplan",
      "Технические планы",
      "Технический план здания, сооружения, помещения; подготовка для постановки на учёт и регистрации.",
      "Подготовка технического плана выполняется с отражением параметров объекта, координат и характеристик в соответствии с требованиями к точности работ. Результат оформляется в XML по XML-схемам Росреестра.",
      [
        "Согласование перечня необходимых материалов",
        "Обследование объекта (при необходимости) и замеры",
        "Камеральное оформление планов и пояснительная записка",
        "Формирование электронного документа (XML) и комплекта на носителе",
      ],
      [
        "Правоустанавливающие документы на объект",
        "Выписка из ЕГРН (при наличии)",
        "Правоустанавливающие документы на земельный участок",
        "Разрешение на ввод (для новых объектов), проектная документация — по необходимости",
      ],
      "Ориентировочно 10–30 рабочих дней.",
      25000,
      20
    ),
    mk(
      "postanovka-ku",
      "Постановка на кадастровый учёт",
      "Комплекс мероприятий по формированию заявления и пакета документов для постановки на учёт.",
      "Подготовка пакета определяется основанием: вновь образуемый объект, снятие с учёта, исправление кадастровой ошибки — по согласованной модели работ.",
      [
        "Определение основания и перечня документов",
        "Подготовка электронного заявления и XML-документов",
        "Контроль комплектности и направление в орган регистрации",
        "Сопровождение до получения результата учётных действий",
      ],
      [
        "Документы правообладателя",
        "Технический план / межевой план — по виду объекта",
        "Платёжные документы (пошлины) — по необходимости",
      ],
      "Сроки определяются регламентом оказания услуги и объёмом документации.",
      12000,
      30
    ),
    mk(
      "shema-raspolozheniya",
      "Подготовка схем",
      "Схемы расположения земельных участков на кадастровом плане территории и иные схематические материалы.",
      "Объём работ уточняется из состава требуемой схемы, исходных картографических материалов и актуальности сведений.",
      ["Сбор исходных данных", "Подготовка графической части", "Согласование и передача результата"],
      ["Выписка из ЕГРН", "Документы основания", "Ситуационный план"],
      "Ориентировочно 7–20 рабочих дней.",
      15000,
      40
    ),
    mk(
      "utochnenie-granic",
      "Уточнение границ",
      "Уточнение местоположения границ земельного участка и (или) площади.",
      "Выполняется при выявлении расхождений со сведениями ЕГРН, по соглашению с соседями либо в рамках решения суда — в зависимости от ситуации.",
      ["Анализ причины расхождения", "Полевые работы", "Межевой план", "Сопровождение учётных действий"],
      ["Выписка из ЕГРН", "Правоустанавливающие документы", "Информация по соседям — при необходимости"],
      "Ориентировочно 14–40 рабочих дней.",
      40000,
      50
    ),
    mk(
      "soprovozhdenie",
      "Сопровождение регистрации",
      "Консультации и сопровождение по взаимодействию с Росреестром и МФЦ.",
      "Помощь в подготовке обращений, контроль статуса, интерпретация полученных уведомлений. Услуга не заменяет государственные процедуры.",
      ["Анализ запроса и маршрута подачи", "Подготовка комплекта", "Поддержка до результата"],
      ["Идентификационные документы", "Исходная документация по объекту"],
      "Индивидуально по задаче.",
      8000,
      60
    ),
    mk(
      "konsultatsii",
      "Кадастровые консультации",
      "Разъяснение процедур кадастрового учёта и регистрации прав в типовых и нетиповых ситуациях.",
      "Консультация может проводиться очно и дистанционно; при необходимости подготавливается письменное резюме.",
      ["Формулировка вопроса", "Анализ документов", "Рекомендации по порядку действий"],
      ["Имеющиеся документы по объекту (при наличии)"],
      "1–3 рабочих дня на подготовку ответа.",
      3500,
      70
    ),
    mk(
      "nedvizhimost",
      "Работы по недвижимости",
      "Сопутствующее консультирование и подготовка материалов по объектам недвижимости в комплексе с кадастровыми задачами.",
      "Объём работ определяется после анализа ситуации; возможно объединение с межеванием и техническим планом.",
      ["Сбор данных", "План работ", "Исполнение и контроль"],
      ["Определяется по результатам первичного анализа"],
      "Индивидуально.",
      18000,
      80
    ),
  ];
}

async function main() {
  const demoDir = path.join(process.cwd(), env.STORAGE_ROOT, "demo-pdf");
  await fs.promises.mkdir(demoDir, { recursive: true });
  const samplePdf = path.join(demoDir, "obrazets-dokumenta.pdf");
  await fs.promises.writeFile(samplePdf, demoPdfBytes());
  const relDemo = path.posix.join("demo-pdf", "obrazets-dokumenta.pdf");

  await prisma.auditLog.deleteMany();
  await prisma.vacancyApplication.deleteMany();
  await prisma.applicationMessage.deleteMany();
  await prisma.applicationAttachment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.news.deleteMany();
  await prisma.normativeItem.deleteMany();
  await prisma.officialDocument.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.user.deleteMany();

  await prisma.pricingRule.createMany({
    data: [
      { key: "base_per_sotka", value: "1800" },
      { key: "district_factor_pavlovsky", value: "1" },
      { key: "district_factor_remote", value: "1.25" },
      { key: "urgent_factor", value: "1.35" },
      { key: "object_zu", value: "1" },
      { key: "object_oks", value: "1.15" },
      { key: "object_kv", value: "0.85" },
    ],
  });

  await prisma.service.createMany({ data: serviceData() });

  await prisma.qualification.createMany({
    data: [
      {
        title: "Высшее образование",
        org: "Технический вуз по профилю «Прикладная геодезия / землеустройство»",
        year: 2019,
        description: "Классическое инженерное образование в области геодезии и картографии.",
        sortOrder: 10,
      },
      {
        title: "Профессиональная переподготовка",
        org: "ДПО (кадастровая деятельность)",
        year: 2021,
        description: "Переподготовка по направлению подготовки кадастровых инженеров.",
        sortOrder: 20,
      },
      {
        title: "Повышение квалификации",
        org: "Учебный центр (землеустройство, ЕГРН)",
        year: 2025,
        description: "Актуализация знаний по XML-схемам и изменениям законодательства.",
        sortOrder: 30,
      },
    ],
  });

  await prisma.news.createMany({
    data: [
      {
        slug: "izmeneniya-xml-shem",
        title: "Обновление XML-схем межевых планов",
        summary: "Напоминание о контроле актуальности форматов при подаче документов.",
        body: "При подготовке электронных документов рекомендуется проверять актуальность XML-схем на официальном сайте Росреестра. Несоответствие формату является частой причиной приостановки.",
        published: true,
        publishedAt: new Date(),
      },
      {
        slug: "grafik-priema",
        title: "График приёма заявителей",
        summary: "Консультации по предварительной записи.",
        body: "Для очной консультации используйте форму записи на сайте. Телефон для срочных вопросов указан в разделе контактов.",
        published: true,
        publishedAt: new Date(Date.now() - 86400000 * 3),
      },
    ],
  });

  await prisma.normativeItem.createMany({
    data: [
      {
        category: "FEDERAL",
        title: "Федеральный закон № 218-ФЗ",
        description: "О государственной регистрации недвижимости.",
        externalUrl: "http://www.consultant.ru/document/cons_doc_LAW_182047/",
        sortOrder: 10,
      },
      {
        category: "CADASTRE",
        title: "Федеральный закон № 221-ФЗ",
        description: "О кадастровой деятельности.",
        externalUrl: "http://www.consultant.ru/document/cons_doc_LAW_151582/",
        sortOrder: 20,
      },
      {
        category: "SAMPLE",
        title: "Образец описания (демонстрационный PDF)",
        description: "Обезличенный образец структуры документа.",
        filePath: relDemo,
        sortOrder: 30,
      },
    ],
  });

  await prisma.officialDocument.createMany({
    data: [
      {
        kind: "DIPLOMA",
        title: "Диплом о высшем образовании",
        description: "Реквизиты документа предоставляются при заключении договора.",
        filePath: relDemo,
        isPublic: true,
        sortOrder: 10,
      },
      {
        kind: "CERTIFICATE",
        title: "Удостоверение о повышении квалификации",
        description: "Последний цикл повышения квалификации.",
        filePath: relDemo,
        isPublic: true,
        sortOrder: 20,
      },
      {
        kind: "INSURANCE",
        title: "Полис страхования ответственности",
        description: "Действующий полис; образец без персональных данных.",
        filePath: relDemo,
        isPublic: true,
        sortOrder: 30,
      },
    ],
  });

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.local").toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";
  const clientEmail = (process.env.SEED_CLIENT_EMAIL ?? "client@example.local").toLowerCase();
  const clientPass = process.env.SEED_CLIENT_PASSWORD ?? "ClientPass123!";

  const clientHash = await bcrypt.hash(clientPass, 12);
  const adminHash = await bcrypt.hash(adminPass, 12);

  const demoClient = await prisma.user.create({
    data: {
      email: clientEmail,
      passwordHash: clientHash,
      firstName: "Иван",
      lastName: "Клиентов",
      phone: "+7 900 000-00-22",
      role: "CLIENT",
    },
  });

  const opsAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Администратор",
      lastName: "Сайта",
      phone: "+7 913 000-00-00",
      role: "ADMIN",
    },
  });

  await prisma.vacancy.create({
    data: {
      title: "Стажировка помощника кадастрового инженера",
      slug: "assistant-internship",
      description:
        "Практическая работа с полевыми съёмками, подготовкой техплана и межевого дела под руководством инженера.",
      requirements:
        "Среднее специальное или незаконченное высшее по профилю; внимательность, умение работать с документацией; базовые навыки ГИС приветствуются.",
      isActive: true,
    },
  });

  const app1 = await prisma.application.create({
    data: {
      publicNumber: "ПК-2026-00001",
      userId: demoClient.id,
      serviceSlug: "mezhevanie",
      requestType: "REQUEST",
      status: "IN_PROGRESS",
      contactName: "Иван Клиентов",
      contactEmail: demoClient.email,
      contactPhone: "+7 900 000-00-22",
      message: "Прошу подготовить межевание участка в Павловском районе.",
    },
  });

  await prisma.application.create({
    data: {
      publicNumber: "ПК-2026-00002",
      userId: null,
      serviceSlug: "tehplan",
      requestType: "CONSULTATION",
      status: "DOCS",
      contactName: "Потенциальный клиент",
      contactEmail: "guest@example.com",
      contactPhone: "+7 903 000-00-00",
      message: "Нужна консультация по техплану на дом.",
    },
  });

  await prisma.applicationMessage.create({
    data: {
      applicationId: app1.id,
      authorRole: "ADMIN",
      authorUserId: opsAdmin.id,
      body: "Добрый день. Запрошены выписки из ЕГРН; после получения приступим к полевой части.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: demoClient.id,
      type: "APPLICATION",
      title: "Сообщение по обращению",
      body: app1.publicNumber,
      read: false,
    },
  });

  await prisma.review.createMany({
    data: [
      {
        authorName: "ООО «АлтайСтройИнвест»",
        rating: 5,
        comment:
          "Сроки соблюдены, документация принята с первого предоставления. Рекомендуем.",
        published: true,
      },
      {
        authorName: "Елена Сергеевна К.",
        rating: 5,
        comment: "Грамотные разъяснения по регистрации, без навязанных услуг.",
        published: true,
      },
    ],
  });

  const slot = new Date();
  slot.setUTCDate(slot.getUTCDate() + 2);
  slot.setUTCHours(11, 0, 0, 0);
  const slotEnd = new Date(slot.getTime() + 3600000);
  await prisma.appointment.create({
    data: {
      userId: demoClient.id,
      startsAt: slot,
      endsAt: slotEnd,
      status: "CONFIRMED",
      contactName: "Иван Клиентов",
      contactPhone: "+7 900 000-00-22",
      contactEmail: demoClient.email,
      notes: "Первичная консультация",
    },
  });

  console.log("Seed completed. Admin:", adminEmail, "Client:", clientEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
