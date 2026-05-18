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

function checklistHtml(items) {
  return items.map(([title, body]) =>
    `        <div class="check-item"><span class="check-mark">✓</span><span><strong>${esc(title)}</strong> — ${esc(body)}</span></div>`
  ).join('\n');
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
        <div class="tier-cta"><a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener" class="${btnClass}">${esc(t.cta)}</a></div>
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
                <p>15 минут в Telegram. Расскажете про сайт, кто клиенты, какие формы и платежи есть. Сразу скажу что вижу.</p>
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
    <meta name="theme-color" content="#0a0a0a">

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

    <link rel="preconnect" href="https://chimitdorzhi.tech" crossorigin>
    <style>
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
            src: url('https://chimitdorzhi.tech/assets/fonts/InterVariable.woff2') format('woff2-variations'),
                 url('https://chimitdorzhi.tech/assets/fonts/InterVariable.woff2') format('woff2');
        }
    </style>
    <link rel="stylesheet" href="/${isRoot ? 'style.css' : 'style.css'}?v=3">

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
                <span>CHIMITDORZHI</span>
                <span class="logo-badge">АУДИТ</span>
            </a>
            <a href="https://chimitdorzhi.tech" target="_blank" rel="noopener" class="nav-back">← Все услуги</a>
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

${navSwitcher(key)}
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
            <div class="hero-actions" style="margin-bottom:0;">
                <a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener" class="btn btn-accent btn-big">Написать в Telegram →</a>
                <a href="#pricing" class="btn btn-ghost btn-big">Тарифы</a>
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

    <section id="pricing" class="section section-alt">
        <div class="container">
            <span class="section-label">${esc(p.pricingLabel)}</span>
            <h2>${esc(p.pricingHeading)}</h2>
            <p class="section-sub">${esc(p.pricingSub)}</p>
            <div class="pricing">
${tiersHtml(p.tiers)}
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <span class="section-label">Как работаем</span>
            <h2>4 простых этапа</h2>
            <p class="section-sub">Для любого из 3 аудитов процесс одинаковый. Никакого формализма и бумажек — всё в Telegram и по email.</p>
${COMMON_STEPS}
        </div>
    </section>

    <section class="section section-alt">
        <div class="container">
            <span class="section-label">Частые вопросы</span>
            <h2>FAQ</h2>
            <p class="section-sub" style="margin-bottom: 32px;">Не нашли ответа — спросите в <a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener">Telegram</a>.</p>
${COMMON_FAQ_HTML}
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="cta-block">
                <h2>Не знаете с чего начать?</h2>
                <p>Напишите в Telegram. За 15 минут разберёмся какой аудит вам сейчас актуальнее, и какой тариф подойдёт. Это бесплатно и без обязательств.</p>
                <a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener" class="btn btn-accent btn-big">Написать в Telegram →</a>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:22px;max-width:560px;">
                    * Цены «от» — финальная стоимость зависит от размера сайта, сложности и срочности. Уточняем после брифа. Информация не является публичной офертой.
                </p>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p><a href="https://chimitdorzhi.tech" target="_blank" rel="noopener">← Все услуги на chimitdorzhi.tech</a></p>
            <p>
                <a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener">Telegram</a> ·
                <a href="mailto:chimitdorzhi26@gmail.com">chimitdorzhi26@gmail.com</a> ·
                <a href="tel:+79316053007">+7 (931) 605-30-07</a>
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

    <a href="https://t.me/chimitdorzhi" target="_blank" rel="noopener" class="btn btn-accent float-cta">Написать в Telegram →</a>

    <!-- Cookie consent (152-ФЗ active opt-in) -->
    <div class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Согласие на использование cookie">
        <div class="cookie-inner">
            <div class="cookie-header">
                <span class="cookie-icon">🍪</span>
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
