// Generates 3 audit pages: index.html, security/index.html, legal/index.html
// from tools/pages-data.js + shared template.
// Run: node tools/build.js

const fs = require('fs');
const path = require('path');
const { pages, SITE } = require('./pages-data');

const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICONS = {
  fz152: `<svg class="tab-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  security: `<svg class="tab-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  legal: `<svg class="tab-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 6c0 2 1.5 3 3 3s3-1 3-3l-3-6z"/><path d="M19 7l-3 6c0 2 1.5 3 3 3s3-1 3-3l-3-6z"/><path d="M8 21h8"/></svg>`,
};

const ORDER = ['fz152', 'security', 'legal'];

// Каналы связи — лид пишет, куда удобно. goal = идентификатор цели в Яндекс.Метрике.
const CONTACTS = {
  tg:    { href: 'https://t.me/chimitdorzhi', label: 'Telegram', goal: 'lead_tg' },
  max:   { href: 'https://max.ru/u/f9LHodD0cOLsid6YR1sWYPloKg45H6ncCJxPbNRIlxJ3Nkv5N32hLoVM9W4', label: 'MAX', goal: 'lead_max' },
  vk:    { href: 'https://vk.com/chimitdorzhi', label: 'ВКонтакте', goal: 'lead_vk' },
  email: { href: 'mailto:chimitdorzhi26@gmail.com', label: 'Email', goal: 'lead_email' },
  phone: { href: 'tel:+79316053007', label: '+7 931 605-30-07', goal: 'lead_phone' },
};
const ymGoal = (goal) => `onclick="if(window.ym)ym(109281884,'reachGoal','${goal}')"`;

// Мультиканальный ряд кнопок (Telegram приоритетная, остальные — равнозначные).
function contactButtons() {
  const c = CONTACTS;
  return `<div class="contact-buttons">
                <a href="${c.tg.href}" target="_blank" rel="noopener" class="btn btn-accent btn-big contact-btn contact-tg" ${ymGoal(c.tg.goal)}>Telegram</a>
                <a href="${c.max.href}" target="_blank" rel="noopener" class="btn btn-ghost btn-big contact-btn contact-max" ${ymGoal(c.max.goal)}>MAX</a>
                <a href="${c.vk.href}" target="_blank" rel="noopener" class="btn btn-ghost btn-big contact-btn contact-vk" ${ymGoal(c.vk.goal)}>ВКонтакте</a>
                <a href="${c.email.href}" class="btn btn-ghost btn-big contact-btn contact-email" ${ymGoal(c.email.goal)}>Email</a>
            </div>`;
}

function navSwitcher(activeKey) {
  return `<nav class="audit-switcher" aria-label="Виды аудита">
${ORDER.map((key) => {
  const p = pages[key];
  const active = key === activeKey ? ' active' : '';
  // For static prerendered, use absolute slug paths
  const href = p.slug;
  return `        <a href="${href}" class="audit-pill${active}"${active ? ' aria-current="page"' : ''}>
            ${ICONS[key]}
            <span>${esc(p.label)}</span>
        </a>`;
}).join('\n')}
    </nav>`;
}

function painsHtml(pains) {
  return pains.map(p => `        <div class="pain">
            <div class="pain-amount">${esc(p.amount)}</div>
            <div class="pain-title">${esc(p.title)}</div>
            <div class="pain-body">${esc(p.body)}</div>
        </div>`).join('\n');
}

function checkItemHtml([title, body]) {
  return `                <div class="check-item"><span class="check-mark">✓</span><span><strong>${esc(title)}</strong> — ${esc(body)}</span></div>`;
}
function checklistHtml(items) {
  // Сгруппированный формат: [{group, items:[[t,b],...]}], либо плоский: [[t,b],...]
  if (items.length && items[0] && items[0].group) {
    return items.map(g =>
      `        <div class="check-group">
            <div class="check-group-title">${esc(g.group)}</div>
            <div class="check-group-items">
${g.items.map(checkItemHtml).join('\n')}
            </div>
        </div>`
    ).join('\n');
  }
  return items.map(checkItemHtml).join('\n');
}

function tiersHtml(tiers) {
  return tiers.map(t => {
    const featured = t.featured ? ' tier-featured' : '';
    const features = t.features.map(f =>
      f.ok ? `                <li>${esc(f.text)}</li>` : `                <li class="muted">${esc(f.text)}</li>`
    ).join('\n');
    const btnClass = t.ctaPrimary ? 'btn btn-accent' : 'btn btn-ghost';
    return `    <div class="tier${featured}">
        <div class="tier-name">${esc(t.name)}</div>
        <div class="tier-price"><small>от</small>${esc(t.price)}</div>
        <div class="tier-period">${esc(t.period)}</div>
        <ul class="tier-features">
${features}
        </ul>
        <div class="tier-cta"><a href="#contact" class="${btnClass}">${esc(t.cta)}</a></div>
    </div>`;
  }).join('\n');
}

function statsHtml(stats) {
  return stats.map(s =>
    `        <div class="hero-stat"><div class="hero-stat-num">${esc(s.num)}</div><div class="hero-stat-label">${esc(s.label)}</div></div>`
  ).join('\n');
}

function statsCardHtml(stats) {
  return stats.map(s =>
    `            <div class="hero-stats-card-item">
                <div class="hero-stats-card-num">${esc(s.num)}</div>
                <div class="hero-stats-card-label">${esc(s.label)}</div>
            </div>`
  ).join('\n');
}

function serviceSchema(p) {
  const offers = p.schemaOffers.map(o =>
    `        {"@type": "Offer", "name": "${esc(p.label)} — ${esc(o.name)}", "price": "${o.price}", "priceCurrency": "RUB", "description": "${o.description}"}`
  ).join(',\n');
  return `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "${esc(p.schemaName)}",
      "description": "${esc(p.schemaDescription)}",
      "provider": {
        "@type": "Person",
        "name": "Чимитдоржи Дарижапов",
        "url": "https://chimitdorzhi.tech",
        "telephone": "+7-931-605-30-07",
        "email": "chimitdorzhi26@gmail.com"
      },
      "areaServed": [{"@type": "Country", "name": "Россия"}],
      "offers": [
${offers}
      ],
      "url": "${p.canonical}"
    }
    </script>`;
}

const COMMON_FAQ_SCHEMA = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {"@type":"Question","name":"Что такое 152-ФЗ простыми словами?","acceptedAnswer":{"@type":"Answer","text":"Это закон о персональных данных. Если ваши клиенты оставляют на сайте имя, телефон, email, адрес — это персональные данные. Закон требует чтобы вы это правильно собирали, хранили и защищали. Иначе — штрафы до 18 млн ₽, а с 2024 года введён оборотный штраф до 500 млн ₽ за повторное нарушение."}},
        {"@type":"Question","name":"Зачем мне аудит безопасности, если сайт работает?","acceptedAnswer":{"@type":"Answer","text":"Сайт может работать, но при этом иметь дырки в безопасности, через которые хакер скачает базу клиентов или подменит реквизиты на странице оплаты. Аудит — это профилактика."}},
        {"@type":"Question","name":"Что проверяет юридический аудит?","acceptedAnswer":{"@type":"Answer","text":"Все юридические тексты: оферту (если на сайте есть кнопка 'Купить'), пользовательское соглашение, политику возвратов, рекламные тексты (38-ФЗ), обязательные реквизиты."}},
        {"@type":"Question","name":"Сколько времени занимает аудит?","acceptedAnswer":{"@type":"Answer","text":"От 1 до 7 рабочих дней в зависимости от тарифа и сложности сайта."}},
        {"@type":"Question","name":"Можно ли заказать 2–3 аудита со скидкой?","acceptedAnswer":{"@type":"Answer","text":"Да. При заказе любых 2 аудитов — скидка 10%, при заказе всех 3 — скидка 20%."}},
        {"@type":"Question","name":"С каким договором работаете?","acceptedAnswer":{"@type":"Answer","text":"ИП Дарижапова Рыгзема Баировна (ИНН 031101842043, ОГРНИП 326750000005553). Заключаем договор оказания услуг с актами."}}
      ]
    }
    </script>`;

const COMMON_FAQ_HTML = `        <div class="faq">
            <details>
                <summary>Что такое 152-ФЗ простыми словами?</summary>
                <div class="faq-body">Это закон о персональных данных. Если ваши клиенты оставляют на сайте имя, телефон, email, адрес — это персональные данные. Закон требует, чтобы вы это правильно собирали, хранили и защищали. Иначе — штрафы до 18 млн ₽, а с 2024 года введён оборотный штраф до 500 млн ₽ за повторное нарушение.</div>
            </details>
            <details>
                <summary>Зачем мне аудит безопасности, если сайт работает?</summary>
                <div class="faq-body">Сайт может работать, но при этом иметь дырки в безопасности, через которые хакер скачает базу клиентов или подменит реквизиты на странице оплаты. Аудит — это профилактика: ищем проблемы до того, как ими воспользуются. Один взлом обычно стоит дороже годового аудита.</div>
            </details>
            <details>
                <summary>Что проверяет юридический аудит?</summary>
                <div class="faq-body">Все юридические тексты на сайте: оферту, пользовательское соглашение, политику возвратов, рекламные тексты (38-ФЗ), обязательные реквизиты. Защищает от исков клиентов и штрафов Роспотребнадзора, ФАС, налоговой.</div>
            </details>
            <details>
                <summary>Сколько времени занимает аудит?</summary>
                <div class="faq-body">От 1 до 7 рабочих дней в зависимости от тарифа и сложности сайта. Простые лендинги — 1–2 дня. Крупные интернет-магазины с личными кабинетами — до 7 дней.</div>
            </details>
            <details>
                <summary>Можно ли заказать 2–3 аудита со скидкой?</summary>
                <div class="faq-body">Да. При заказе любых 2 аудитов — скидка 10%, при заказе всех 3 — скидка 20%. Обсудим в Telegram.</div>
            </details>
            <details>
                <summary>Можно ли проверить без доступа к админке?</summary>
                <div class="faq-body">Да, базовый аудит делается со стороны посетителя — проверяем что видно публично. Для глубокого аудита и устранения нарушений нужен доступ.</div>
            </details>
            <details>
                <summary>С каким договором работаете?</summary>
                <div class="faq-body">ИП Дарижапова Рыгзема Баировна (ИНН 031101842043, ОГРНИП 326750000005553). Заключаем договор оказания услуг с актами выполненных работ. Безналичная оплата на расчётный счёт ИП.</div>
            </details>
            <details>
                <summary>Что если у нас уже есть предписание Роскомнадзора?</summary>
                <div class="faq-body">Берём в работу срочно — приоритет 1. Аудит делаем за 24 часа, исправления параллельно. Срок исполнения предписания РКН обычно 10 дней — мы укладываемся.</div>
            </details>
        </div>`;

const COMMON_STEPS = `        <div class="steps">
            <div class="step">
                <h3>Бриф</h3>
                <p>15 минут в мессенджере (Telegram, MAX, ВКонтакте) или по телефону. Расскажете про сайт, кто клиенты, какие формы и платежи есть. Сразу скажу что вижу.</p>
            </div>
            <div class="step">
                <h3>Аудит</h3>
                <p>1–7 дней (зависит от тарифа). Проверяю по чек-листу. Готовлю PDF-отчёт с пояснениями простыми словами.</p>
            </div>
            <div class="step">
                <h3>Согласование</h3>
                <p>Обсуждаем что нашлось. Решаем что критично, что — нет. По «Фикс» и «Под ключ» — план исправлений.</p>
            </div>
            <div class="step">
                <h3>Внедрение</h3>
                <p>Если выбрали тариф с исправлениями — устраняю проблемы. Передаю обновлённые документы и доступы.</p>
            </div>
        </div>`;

// --- Гарантия (risk-reversal) ---
const GUARANTEE_HTML = `            <div class="guarantee">
                <span class="guarantee-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </span>
                <div><strong>Гарантия.</strong> Не найду ни одного нарушения — базовый аудит бесплатно. Отчёт точно в срок по тарифу или возврат денег.</div>
            </div>`;

// --- Блок «Кто проводит аудит» (E-E-A-T + доверие) ---
const EXPERT_HTML = `    <section class="section">
        <div class="container">
            <span class="section-label">Кто проводит аудит</span>
            <div class="expert">
                <img class="expert-photo" src="https://chimitdorzhi.tech/hero-photo-600.webp" alt="Чимитдоржи Дарижапов" loading="lazy" width="220" height="280">
                <div class="expert-body">
                    <h2>Чимитдоржи Дарижапов</h2>
                    <p class="expert-role">IT-специалист, 16+ лет опыта. Разработка, AI/ML и соответствие 152-ФЗ.</p>
                    <p>За плечами — <strong>100+ проверенных и приведённых в порядок сайтов</strong>. Провожу аудит обработки персональных данных, готовлю документы и помогаю подать уведомление в Роскомнадзор. Работаю напрямую — вы общаетесь с тем, кто реально делает аудит, а не с менеджером юрфирмы-конвейера.</p>
                    <ul class="expert-points">
                        <li>Аудит сайтов и бизнес-процессов по 152-ФЗ и 572-ФЗ</li>
                        <li>Исправления под ключ: политики, согласия, cookie, локализация данных</li>
                        <li>По договору с ИП, оплата по счёту, закрывающие акты</li>
                    </ul>
                    <p class="expert-note">Это практическая помощь по приведению сайта в порядок, а не юридическая консультация.</p>
                    <div class="expert-links">
                        <div class="expert-links-col">
                            <div class="expert-links-title">Разбираю тему в блоге</div>
                            <a href="https://chimitdorzhi.tech/blog/audit-152-fz-2026/" target="_blank" rel="noopener">Аудит сайта по 152-ФЗ: инструкция</a>
                            <a href="https://chimitdorzhi.tech/blog/152-fz-izmeneniya-2027/" target="_blank" rel="noopener">Что меняется в 152-ФЗ</a>
                            <a href="https://chimitdorzhi.tech/blog/uvedomlenie-rkn-2026/" target="_blank" rel="noopener">Уведомление в Роскомнадзор</a>
                            <a href="https://chimitdorzhi.tech/blog/utechki-pd-24-chasa-2026/" target="_blank" rel="noopener">Утечка ПД: что делать за 24 часа</a>
                            <a href="https://chimitdorzhi.tech/blog/" target="_blank" rel="noopener">Все статьи →</a>
                        </div>
                        <div class="expert-links-col">
                            <div class="expert-links-title">Готовые решения</div>
                            <a href="https://chimitdorzhi.tech/predlozheniya/152-fz-pod-klyuch/" target="_blank" rel="noopener">152-ФЗ под ключ</a>
                            <a href="https://chimitdorzhi.tech/predlozheniya/152fz-klinika/" target="_blank" rel="noopener">Комплаенс для клиники</a>
                            <a href="https://chimitdorzhi.tech/predlozheniya/biometriya-152fz-soglasiya/" target="_blank" rel="noopener">Биометрия и согласия</a>
                            <a href="https://chimitdorzhi.tech/predlozheniya/" target="_blank" rel="noopener">Все предложения →</a>
                        </div>
                    </div>
                    <a href="#contact" class="btn btn-accent">Обсудить мой случай →</a>
                </div>
            </div>
        </div>
    </section>`;

// --- Калькулятор риска штрафа (только для 152-ФЗ) ---
const CALC_HTML = `    <section class="section section-alt" id="calc">
        <div class="container">
            <span class="section-label">Калькулятор риска</span>
            <h2>Узнайте свой потенциальный штраф за 30 секунд</h2>
            <p class="section-sub">Три вопроса о вашем сайте. Приблизительная оценка по актуальной редакции 152-ФЗ — не юридическое заключение.</p>
            <div class="calc">
                <div class="calc-q" data-q="1">
                    <p class="calc-q-title">1. Подавали уведомление в Роскомнадзор (реестр операторов ПД)?</p>
                    <div class="calc-opts">
                        <button type="button" class="calc-opt" data-v="0">Да, мы в реестре</button>
                        <button type="button" class="calc-opt" data-v="1">Нет / не знаю</button>
                    </div>
                </div>
                <div class="calc-q" data-q="2">
                    <p class="calc-q-title">2. На формах сайта есть галочка согласия на обработку ПД?</p>
                    <div class="calc-opts">
                        <button type="button" class="calc-opt" data-v="0">Да, есть</button>
                        <button type="button" class="calc-opt" data-v="1">Нет / не знаю</button>
                    </div>
                </div>
                <div class="calc-q" data-q="3">
                    <p class="calc-q-title">3. Где хранятся данные клиентов (база, CRM, формы)?</p>
                    <div class="calc-opts">
                        <button type="button" class="calc-opt" data-v="0">На серверах в РФ</button>
                        <button type="button" class="calc-opt" data-v="1">За рубежом / не знаю</button>
                    </div>
                </div>
                <div class="calc-result" id="calcResult" hidden>
                    <div class="calc-amount" id="calcAmount"></div>
                    <div class="calc-level" id="calcLevel"></div>
                    <p class="calc-note">Приблизительная оценка по статьям КоАП, не юридическое заключение. Точную картину и план исправлений даст аудит.</p>
                    <a href="#contact" class="btn btn-accent btn-big" onclick="if(window.ym)ym(109281884,'reachGoal','calc_lead')">Получить точный разбор бесплатно →</a>
                </div>
            </div>
        </div>
    </section>`;

const CALC_SCRIPT = `    <script>
    (function(){
        var answers = {};
        var qs = document.querySelectorAll('.calc-q');
        if(!qs.length) return;
        qs.forEach(function(q){
            q.querySelectorAll('.calc-opt').forEach(function(btn){
                btn.addEventListener('click', function(){
                    q.querySelectorAll('.calc-opt').forEach(function(b){ b.classList.remove('active'); });
                    btn.classList.add('active');
                    answers[q.getAttribute('data-q')] = parseInt(btn.getAttribute('data-v'), 10);
                    if(Object.keys(answers).length === 3){ render(); }
                });
            });
        });
        function fmt(n){ return n.toLocaleString('ru-RU'); }
        function render(){
            var min = 0, max = 0;
            if(answers['1']){ min += 100000; max += 300000; }
            if(answers['2']){ min += 300000; max += 700000; }
            if(answers['3']){ min += 1000000; max += 6000000; }
            var res = document.getElementById('calcResult');
            var amount = document.getElementById('calcAmount');
            var level = document.getElementById('calcLevel');
            if(max === 0){
                amount.textContent = 'Базовые требования, похоже, закрыты';
                level.textContent = 'Низкий риск — но детали проверит аудит';
                level.className = 'calc-level calc-level-low';
            } else {
                amount.textContent = 'Потенциальный штраф: от ' + fmt(min) + ' до ' + fmt(max) + ' ₽';
                if(max >= 1000000){ level.textContent = 'Высокий риск: возможна утечка и блокировка сайта'; level.className = 'calc-level calc-level-high'; }
                else { level.textContent = 'Средний риск: формальные нарушения, которые легко закрыть'; level.className = 'calc-level calc-level-mid'; }
            }
            res.hidden = false;
            res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if(window.ym) ym(109281884, 'reachGoal', 'calc_done');
        }
    })();
    </script>`;

// --- Разбор типовых нарушений по нишам (доказательство экспертизы вместо отзывов) ---
const NICHE_HTML = `    <section class="section">
        <div class="container">
            <span class="section-label">Опыт по нишам</span>
            <h2>Что обычно находим в разных нишах</h2>
            <p class="section-sub">Закон один для всех, но типовые нарушения зависят от того, какие данные вы собираете. Вот что встречается чаще всего — за 100+ проверенных сайтов картина повторяется.</p>
            <div class="niche-grid">
                <div class="niche-card">
                    <div class="niche-title">Доставка еды и кафе</div>
                    <ul>
                        <li>Форма заказа без галочки согласия на обработку ПД</li>
                        <li>Адреса и телефоны уходят в стороннюю CRM/сервис доставки без договора поручения</li>
                        <li>Акции и рассылки без согласия на рекламу (ст. 18 38-ФЗ)</li>
                    </ul>
                </div>
                <div class="niche-card">
                    <div class="niche-title">Медицина и клиники</div>
                    <ul>
                        <li>Данные о здоровье — особая категория (ст. 10), нужно усиленное письменное согласие</li>
                        <li>Онлайн-запись хранит ПД пациентов без правильного основания</li>
                        <li>Передача данных в лабораторию или другому врачу без оформления</li>
                    </ul>
                </div>
                <div class="niche-card">
                    <div class="niche-title">Образование и детские центры</div>
                    <ul>
                        <li>Данные несовершеннолетних — нужно согласие законного представителя</li>
                        <li>Фото детей на сайте и в соцсетях без согласия родителей</li>
                        <li>CRM или платформа обучения на иностранном сервере — нарушение локализации</li>
                    </ul>
                </div>
                <div class="niche-card">
                    <div class="niche-title">Госучреждения и муниципалитеты</div>
                    <ul>
                        <li>Обращения граждан — ПД под усиленным контролем РКН и прокуратуры</li>
                        <li>Формы обратной связи и приёма без корректного согласия</li>
                        <li>Размещение данных на несертифицированной инфраструктуре</li>
                    </ul>
                </div>
                <div class="niche-card">
                    <div class="niche-title">Интернет-магазины</div>
                    <ul>
                        <li>Cookie и аналитика без активного согласия (баннер с предотметкой)</li>
                        <li>Передача в СДЭК, Почту, платёжные системы без договора поручения</li>
                        <li>Иностранные пиксели и счётчики без оформленной трансграничной передачи</li>
                    </ul>
                </div>
                <div class="niche-card">
                    <div class="niche-title">Услуги с записью (салоны, юристы, репетиторы)</div>
                    <ul>
                        <li>Онлайн-запись собирает ПД, а политики и согласия нет</li>
                        <li>Не подано уведомление в реестр операторов РКН</li>
                        <li>Рассылки и напоминания в мессенджерах без согласия</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">Фитнес-клубы и спортшколы</div>
                    <ul>
                        <li>Вход по лицу или отпечатку — это биометрия: нужны ЕБС и отдельное согласие</li>
                        <li>Данные детей в секциях — согласие законного представителя</li>
                        <li>Абонементы и заморозки хранят ПД без основания и сроков</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">Туризм: турагентства и отели</div>
                    <ul>
                        <li>Сканы паспортов лежат в почте и мессенджерах без защиты</li>
                        <li>Брони через зарубежные системы — трансграничная передача без оформления</li>
                        <li>Рассылки горящих туров без согласия на рекламу</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">Недвижимость: агентства и застройщики</div>
                    <ul>
                        <li>Паспорта и копии документов уходят в банк под ипотеку без оформления</li>
                        <li>Заявки с сайта собирают ПД, а политики и согласия нет</li>
                        <li>Базы клиентов в Excel и CRM без защиты и сроков хранения</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">HR, рекрутинг, подбор персонала</div>
                    <ul>
                        <li>Резюме соискателей — масса ПД, часто без согласия на обработку</li>
                        <li>Данные хранятся годами после отказа без законного основания</li>
                        <li>Передача анкет заказчику без оформления поручения</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">Автошколы и автосервисы</div>
                    <ul>
                        <li>Данные учеников передаются в ГИБДД без корректного основания</li>
                        <li>Онлайн-запись и история обслуживания хранят ПД клиентов</li>
                        <li>Нет уведомления в реестр операторов РКН</li>
                    </ul>
                </div>
                <div class="niche-card niche-extra">
                    <div class="niche-title">ЖКХ: УК, ТСЖ и СНТ</div>
                    <ul>
                        <li>Публикация списков должников с ФИО и адресами — частое нарушение</li>
                        <li>Данные жильцов и обращения без согласия и защиты</li>
                        <li>Передача данных подрядчикам без договора поручения</li>
                    </ul>
                </div>
            </div>
            <div class="niche-more-wrap"><button type="button" class="niche-more" id="nicheMore">Показать ещё 6 ниш</button></div>
            <p style="text-align:center;color:var(--text-secondary);font-size:0.9rem;margin-top:18px;">Вашей ниши нет в списке? <a href="#contact">Напишите</a> — скажу, на что смотреть именно у вас.</p>
            <script>(function(){var b=document.getElementById('nicheMore');if(!b)return;b.addEventListener('click',function(){var g=document.querySelector('.niche-grid');if(g)g.classList.add('expanded');b.parentNode.style.display='none';});})();</script>
        </div>
    </section>`;

// --- Лид-форма → Telegram-бот (отдельный бот, токен в клиенте, риск принят) ---
const LEAD_TOKEN = '8672193242:AAHz2EQqGI2RMNxl-6YS-LI8QV0E8icKfTY';
const LEAD_CHAT = '1703001728';
const FORM_HTML = `                <form class="lead-form" id="leadForm" novalidate>
                    <input type="url" name="site" class="lead-input" placeholder="Адрес вашего сайта (https://...)" required>
                    <input type="text" name="contact" class="lead-input" placeholder="Как связаться: Telegram, телефон или email" required>
                    <button type="submit" class="btn btn-accent btn-big lead-submit">Получить 3 риска бесплатно →</button>
                    <p class="lead-status" id="leadStatus" role="status"></p>
                </form>
                <p class="contact-or">или напишите мне напрямую:</p>`;
const FORM_SCRIPT = `    <script>
    (function(){
        var f = document.getElementById('leadForm');
        if(!f) return;
        var status = document.getElementById('leadStatus');
        f.addEventListener('submit', function(e){
            e.preventDefault();
            var site = f.site.value.trim(), contact = f.contact.value.trim();
            if(!site || !contact){ status.textContent = 'Заполните оба поля.'; status.className = 'lead-status err'; return; }
            var btn = f.querySelector('.lead-submit');
            btn.disabled = true; status.textContent = 'Отправляю...'; status.className = 'lead-status';
            var text = 'Новая заявка — ' + location.host + location.pathname + String.fromCharCode(10) + 'Сайт: ' + site + String.fromCharCode(10) + 'Контакт: ' + contact;
            fetch('https://api.telegram.org/bot${LEAD_TOKEN}/sendMessage', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: '${LEAD_CHAT}', text: text })
            }).then(function(r){ return r.json(); }).then(function(d){
                if(d.ok){ status.textContent = 'Заявка отправлена. Свяжусь с вами в течение 12 часов.'; status.className = 'lead-status ok'; f.reset(); if(window.ym) ym(109281884, 'reachGoal', 'lead_form'); }
                else { throw new Error('tg'); }
            }).catch(function(){ status.textContent = 'Не отправилось. Напишите мне в мессенджер кнопкой ниже.'; status.className = 'lead-status err'; btn.disabled = false; });
        });
    })();
    </script>`;

function renderPage(key) {
  const p = pages[key];
  // Path to /style.css etc.: from index.html → 'style.css', from /security/index.html → '../style.css'
  const isRoot = p.file === 'index.html';
  const cssPath = isRoot ? 'style.css' : '../style.css';
  const faviconPath = isRoot ? 'favicon.svg' : '../favicon.svg';

  return `<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${esc(p.metaTitle)}</title>
    <meta name="description" content="${esc(p.metaDescription)}">
    <meta name="keywords" content="${esc(p.metaKeywords)}">
    <meta name="author" content="Дарижапов Чимитдоржи">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="theme-color" content="#f4f1ea">

    <link rel="canonical" href="${p.canonical}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${p.canonical}">
    <meta property="og:title" content="${esc(p.title)}">
    <meta property="og:description" content="${esc(p.metaDescription)}">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:site_name" content="audit.chimitdorzhi.tech">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(p.title)}">
    <meta name="twitter:description" content="${esc(p.metaDescription)}">

    <link rel="icon" href="/${isRoot ? 'favicon.svg' : 'favicon.svg'}" type="image/svg+xml">

    <link rel="preload" href="/assets/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/style.css?v=15">

${serviceSchema(p)}
${COMMON_FAQ_SCHEMA}
</head>

<body>
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>

    <!-- NAVBAR -->
    <nav class="navbar">
        <div class="container nav-inner">
            <a href="/" class="logo">
                <span>chimitdorzhi</span>
                <span class="logo-badge">аудит</span>
            </a>
            <a href="https://chimitdorzhi.tech" class="nav-back">← Все услуги</a>
        </div>
    </nav>

    <!-- HERO + AUDIT SWITCHER -->
    <section class="tabs-section">
        <div class="container hero-grid">
            <div class="hero-grid-main">
                <div class="hero-eyebrow">${esc(p.heroEyebrow)}</div>
                <h1 style="font-size:clamp(1.8rem,5vw,3.5rem);margin-bottom:18px;letter-spacing:-1.5px;line-height:1.1;">
                    ${p.h1Html}
                </h1>
                <p style="font-size:clamp(1rem,1.6vw,1.25rem);color:var(--text-secondary);max-width:740px;line-height:1.55;margin-bottom:32px;">
                    ${esc(p.heroSubtitle)}
                </p>

                <div class="hero-actions">
                    <a href="#contact" class="btn btn-accent btn-big">Получить 3 риска бесплатно →</a>
                    <a href="#calc" class="btn btn-ghost btn-big">Узнать свой штраф</a>
                </div>
                <p class="hero-microtrust">Бесплатный разбор · отчёт за 12 часов · без обязательств · отвечаю лично</p>
                <div class="trust-badges">
                    <span class="trust-badge">Договор с ИП</span>
                    <span class="trust-badge">Оплата по счёту</span>
                    <span class="trust-badge">Закрывающие акты</span>
                </div>
            </div>
            <aside class="hero-stats-card" aria-label="Ключевые цифры">
${statsCardHtml(p.heroStats)}
            </aside>
        </div>
    </section>

    <!-- MAIN CONTENT -->
    <section class="section">
        <div class="container">
            <span class="section-label">${esc(p.label)}</span>
            <h2>${esc(p.title.replace(/ — .*$/, ''))}</h2>
            <div class="simple">
                <strong>Простыми словами:</strong> ${p.simpleExplainer}
            </div>
        </div>
    </section>

    <section class="section section-alt">
        <div class="container">
            <span class="section-label">${esc(p.painLabel)}</span>
            <h2>${esc(p.painHeading)}</h2>
            <p class="section-sub">${esc(p.painSub)}</p>
            <div class="pains">
${painsHtml(p.pains)}
            </div>
        </div>
    </section>
${key === 'fz152' ? CALC_HTML : ''}

    <section class="section">
        <div class="container">
            <span class="section-label">${esc(p.checklistLabel)}</span>
            <h2>${esc(p.checklistHeading)}</h2>
            <p class="section-sub">${esc(p.checklistSub)}</p>
            <div class="checklist">
${checklistHtml(p.checklist)}
            </div>
            ${p.checklistFooter ? `<p style="text-align:center;color:var(--text-secondary);font-size:0.88rem;margin-top:20px;">${esc(p.checklistFooter)}</p>` : ''}
        </div>
    </section>

${key === 'fz152' ? NICHE_HTML : ''}

    <section id="pricing" class="section section-alt">
        <div class="container">
            <span class="section-label">${esc(p.pricingLabel)}</span>
            <h2>${esc(p.pricingHeading)}</h2>
            <p class="section-sub">${esc(p.pricingSub)}</p>
            <div class="pricing">
${tiersHtml(p.tiers)}
            </div>
${GUARANTEE_HTML}
        </div>
    </section>

    <section class="section">
        <div class="container">
            <span class="section-label">Как работаем</span>
            <h2>4 простых этапа</h2>
            <p class="section-sub">Для любого из 3 аудитов процесс одинаковый. Никакого формализма и бумажек — всё в мессенджере и по email.</p>
${COMMON_STEPS}
        </div>
    </section>

${EXPERT_HTML}

    <section class="section section-alt">
        <div class="container">
            <span class="section-label">Частые вопросы</span>
            <h2>FAQ</h2>
            <p class="section-sub" style="margin-bottom: 32px;">Не нашли ответа — <a href="#contact">напишите мне</a> в любой мессенджер.</p>
${COMMON_FAQ_HTML}
        </div>
    </section>

    <section class="section" id="contact">
        <div class="container">
            <div class="cta-block">
                <h2>Получите бесплатный экспресс-аудит</h2>
                <p>Оставьте адрес сайта и контакт — пришлю 3 главных риска по 152-ФЗ в течение 12 часов. Бесплатно, без обязательств.</p>
${FORM_HTML}
                ${contactButtons()}
                <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:18px;">
                    или по телефону <a href="${CONTACTS.phone.href}" ${ymGoal(CONTACTS.phone.goal)}>${esc(CONTACTS.phone.label)}</a>
                </p>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:22px;max-width:560px;">
                    * Цены «от» — финальная стоимость зависит от размера сайта, сложности и срочности. Уточняем после брифа. Информация не является публичной офертой.
                </p>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p class="footer-audits">Другие аудиты: ${ORDER.filter(k => k !== key).map(k => `<a href="${pages[k].slug}">${esc(pages[k].label)}</a>`).join(' · ')}</p>
            <p><a href="https://chimitdorzhi.tech">← Все услуги на chimitdorzhi.tech</a></p>
            <p>
                <a href="${CONTACTS.tg.href}" target="_blank" rel="noopener" ${ymGoal(CONTACTS.tg.goal)}>Telegram</a> ·
                <a href="${CONTACTS.max.href}" target="_blank" rel="noopener" ${ymGoal(CONTACTS.max.goal)}>MAX</a> ·
                <a href="${CONTACTS.vk.href}" target="_blank" rel="noopener" ${ymGoal(CONTACTS.vk.goal)}>ВКонтакте</a> ·
                <a href="mailto:chimitdorzhi26@gmail.com" ${ymGoal(CONTACTS.email.goal)}>chimitdorzhi26@gmail.com</a> ·
                <a href="tel:+79316053007" ${ymGoal(CONTACTS.phone.goal)}>+7 (931) 605-30-07</a>
            </p>
            <div class="legal">
                <p>ИП Дарижапова Рыгзема Баировна · ИНН 031101842043 · ОГРНИП 326750000005553</p>
                <p>пер. Каштакский, д. 1а, г. Чита, Забайкальский край</p>
                <p style="margin-top: 8px;">
                    <a href="https://chimitdorzhi.tech/privacy_policy.html" target="_blank" rel="noopener">Политика конфиденциальности</a> ·
                    <a href="https://chimitdorzhi.tech/oferta.html" target="_blank" rel="noopener">Публичная оферта</a>
                </p>
                <p style="margin-top: 12px; opacity: 0.7;">© 2026 Чимитдоржи Дарижапов</p>
            </div>
        </div>
    </footer>

    <a href="#contact" class="btn btn-accent float-cta">Написать мне →</a>

    <!-- Cookie consent (152-ФЗ active opt-in) -->
    <div class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Согласие на использование cookie">
        <div class="cookie-inner">
            <div class="cookie-header">
                <span class="cookie-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></span>
                <h3>Мы используем cookie</h3>
            </div>
            <p class="cookie-text">Сайт использует cookie. Необходимые работают всегда — они нужны для интерфейса. Аналитика помогает улучшать сайт и включается только с вашего согласия. Подробнее — в <a href="https://chimitdorzhi.tech/privacy_policy.html" target="_blank" rel="noopener">политике</a>.</p>
            <div class="cookie-actions">
                <button class="cookie-btn cookie-btn-primary" id="cookieAcceptAll">Принять всё</button>
                <button class="cookie-btn cookie-btn-ghost" id="cookieEssentialOnly">Только необходимые</button>
            </div>
        </div>
    </div>

    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109281884', 'ym');

        ym(109281884, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/109281884" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <!-- /Yandex.Metrika counter -->

    <!-- Cookie consent logic (simplified — 2 buttons) -->
    <script>
        (function () {
            var CONSENT_VERSION = 1;
            var banner = document.getElementById('cookieBanner');
            if (!banner) return;
            function save(consent) {
                consent.version = CONSENT_VERSION;
                consent.timestamp = new Date().toISOString();
                try { localStorage.setItem('cookieConsent', JSON.stringify(consent)); } catch (e) {}
                window.dispatchEvent(new CustomEvent('cookieConsent', { detail: consent }));
                banner.classList.remove('active');
            }
            var stored;
            try { stored = JSON.parse(localStorage.getItem('cookieConsent')); } catch (e) {}
            if (stored && stored.version === CONSENT_VERSION) return;
            setTimeout(function () { banner.classList.add('active'); }, 800);
            document.getElementById('cookieAcceptAll').addEventListener('click', function () {
                save({ essential: true, analytics: true });
            });
            document.getElementById('cookieEssentialOnly').addEventListener('click', function () {
                save({ essential: true, analytics: false });
            });
        })();
    </script>
${key === 'fz152' ? CALC_SCRIPT : ''}
${FORM_SCRIPT}
</body>

</html>
`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ORDER.map((key) => {
  const p = pages[key];
  return `  <url>
    <loc>${p.canonical}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${key === 'fz152' ? '1.0' : '0.9'}</priority>
  </url>`;
}).join('\n')}
</urlset>
`;
}

// MAIN
for (const key of ORDER) {
  const p = pages[key];
  const outPath = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderPage(key), 'utf8');
  console.log(`✓ ${p.file} → ${p.canonical}`);
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(), 'utf8');
console.log('✓ sitemap.xml');
