const defaults = {
  sites: [
    ['YouTube', 'youtube.com', 'red'], ['TikTok', 'tiktok.com', 'black'],
    ['Reddit', 'reddit.com', 'orange'], ['Telegram Web', 'web.telegram.org', 'blue']
  ],
  schedules: [
    ['Глубокая работа', 'Пн–Пт', '09:00 — 12:00'],
    ['Вечер без ленты', 'Каждый день', '21:30 — 07:30']
  ]
}
const load = (key, fallback) => JSON.parse(localStorage.getItem(key) || 'null') || fallback
let sites = load('tg-sites', defaults.sites.map(([name, domain, tone]) => ({ name, domain, tone })))
let schedules = load('tg-schedules', defaults.schedules.map(([title, days, time], id) => ({ id, title, days, time, active: true })))
let focus = false

const icon = (char, cls = '') => `<span class="text-icon ${cls}">${char}</span>`
const app = document.querySelector('#root')

function render() {
  const enabled = schedules.filter(x => x.active).length
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar" id="sidebar"><div class="brand"><img class="brand-mark" src="/assets/touch-grass-logo.svg" alt="Touch Grass"><span>touch<br><i>grass</i></span></div>
      <nav><div class="nav-label">Пространство</div><a class="nav-item active" href="#dashboard">${icon('◈')} Обзор</a><a class="nav-item" href="#schedule">${icon('▣')} Расписание <span class="nav-count">${enabled}</span></a><a class="nav-item" href="#sites">${icon('◇')} Сайты под защитой <span class="nav-count">${sites.length}</span></a></nav>
      <div class="sidebar-bottom"><a class="nav-item muted" href="#help">${icon('?')} Как это работает</a><div class="profile"><div class="avatar">С</div><div><strong>Сергей</strong><small>Личный режим</small></div><span>⌄</span></div></div>
    </aside><button class="scrim" id="scrim" aria-label="Закрыть меню"></button>
    <main class="main" id="dashboard"><header class="topbar"><button class="mobile-menu" id="mobile-menu">☰</button><div class="breadcrumb">Мой фокус <span>/</span> Обзор</div><div class="top-actions"><button class="icon-button">♢</button><button class="help-link">? &nbsp; Помощь</button></div></header>
      <div class="content"><section class="intro"><div><p class="eyebrow">ВТОРНИК, 4 АВГУСТА</p><h1>Меньше шума.<br><em>Больше тебя.</em></h1><p class="intro-copy">Настрой пространство, в котором легко оставаться<br class="desktop-break"> в моменте. Мы позаботимся об остальном.</p></div><img class="leaf-illustration" src="/assets/touch-grass-logo.svg" alt="Touch Grass"></section>
        <section class="focus-banner"><div class="focus-icon">◇</div><div class="focus-text"><strong>${focus ? 'Фокус включён' : 'Фокус сейчас выключен'}</strong><span>${focus ? 'Отвлекающие сайты заблокированы до конца сессии.' : 'Включи ручную сессию, если нужно сосредоточиться прямо сейчас.'}</span></div><button class="focus-toggle ${focus ? 'on' : ''}" id="focus">${focus ? 'Остановить' : 'Включить фокус'} <b>↗</b></button></section>
        <div class="section-heading" id="schedule"><div><p class="eyebrow">АВТОМАТИЗАЦИЯ</p><h2>Твоё расписание</h2></div><button class="outline-button" id="new-schedule">＋ &nbsp; Новое расписание</button></div>
        <section class="schedule-grid">${schedules.map(s => `<article class="schedule-card ${s.active ? '' : 'disabled'}"><div class="card-top"><div class="schedule-symbol">◷</div><button class="switch ${s.active ? 'checked' : ''}" data-toggle="${s.id}"><span></span></button></div><h3>${s.title}</h3><div class="schedule-meta"><span>▣ &nbsp;${s.days}</span><span>◷ &nbsp;${s.time}</span></div><div class="card-foot"><span class="blocked-label"><span class="dot"></span> ${sites.length} сайта под защитой</span><button class="more-button">→</button></div></article>`).join('')}<button class="add-card" id="add-card"><span>＋</span><strong>Добавить расписание</strong><small>Настроить своё окно тишины</small></button></section>
        <div class="section-heading sites-heading" id="sites"><div><p class="eyebrow">СПИСОК БЛОКИРОВКИ</p><h2>Сайты под защитой</h2></div><button class="text-button" id="manage-sites">Управлять списком ↗</button></div>
        <section class="sites-panel"><div class="sites-summary"><div class="big-number">${String(sites.length).padStart(2, '0')}</div><div><strong>сайта отдыхают</strong><p>Они будут недоступны<br>во время активных окон.</p></div></div><div class="site-list">${sites.map(s => `<div class="site-row"><span class="site-avatar ${s.tone}">${s.name[0]}</span><span class="site-name"><strong>${s.name}</strong><small>${s.domain}</small></span><span class="site-status">✓ &nbsp;Блокируется</span><button class="remove-site" data-remove="${s.domain}">♧</button></div>`).join('')}<button class="add-site" id="add-site">＋ &nbsp;Добавить сайт</button></div></section>
        <footer><span>Touch Grass v0.1 · Всё хранится локально</span><a href="#privacy">Конфиденциальность ↗</a></footer></div></main><div id="toast"></div></div>`
  bind()
}

function toast(message) { const el = document.querySelector('#toast'); el.className = 'toast'; el.textContent = `✓  ${message}`; setTimeout(() => el.className = '', 2400) }
function addSite() { const value = prompt('Домен сайта, например: instagram.com'); if (!value?.trim()) return; const domain = value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]; if (sites.some(s => s.domain === domain)) return toast('Этот сайт уже в списке'); sites.push({ name: domain.split('.')[0].replace(/^./, x => x.toUpperCase()), domain, tone: 'green' }); localStorage.setItem('tg-sites', JSON.stringify(sites)); render(); toast('Сайт добавлен в список') }
function newSchedule() { const title = prompt('Название расписания'); if (!title?.trim()) return; const time = prompt('Время, например: 09:00 — 12:00', '09:00 — 12:00') || '09:00 — 12:00'; schedules.push({ id: Date.now(), title, days: 'Пн–Пт', time, active: true }); localStorage.setItem('tg-schedules', JSON.stringify(schedules)); render(); toast('Расписание создано') }
function bind() {
  document.querySelector('#focus').onclick = () => { focus = !focus; render(); toast(focus ? 'Фокус включён на 25 минут' : 'Фокус выключен') }
  document.querySelectorAll('[data-toggle]').forEach(btn => btn.onclick = () => { const s = schedules.find(x => x.id == btn.dataset.toggle); s.active = !s.active; localStorage.setItem('tg-schedules', JSON.stringify(schedules)); render() })
  document.querySelectorAll('[data-remove]').forEach(btn => btn.onclick = () => { sites = sites.filter(x => x.domain !== btn.dataset.remove); localStorage.setItem('tg-sites', JSON.stringify(sites)); render(); toast('Сайт убран из списка') })
  ;['#new-schedule', '#add-card'].forEach(id => document.querySelector(id).onclick = newSchedule)
  ;['#add-site', '#manage-sites'].forEach(id => document.querySelector(id).onclick = addSite)
  document.querySelector('#mobile-menu').onclick = () => { document.querySelector('#sidebar').classList.add('open'); document.querySelector('#scrim').classList.add('visible') }
  document.querySelector('#scrim').onclick = () => { document.querySelector('#sidebar').classList.remove('open'); document.querySelector('#scrim').classList.remove('visible') }
}
render()
