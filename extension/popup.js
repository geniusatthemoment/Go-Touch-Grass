const $ = selector => document.querySelector(selector)

function send(type) { return chrome.runtime.sendMessage({ type }) }

function render(state) {
  const active = state.enabled !== false && (state.focusActive || state.scheduleActive)
  const button = $('#focus-button')
  $('#site-count').textContent = String(state.sites.length).padStart(2, '0')
  $('#schedule-count').textContent = state.schedules.filter(x => x.active).length
  $('#status-text').textContent = active ? 'защита включена' : 'защита выключена'
  $('.status').classList.toggle('off', !active)
  $('#protection-toggle').textContent = state.enabled === false ? 'Включить защиту' : 'Отключить защиту'
  button.classList.toggle('active', state.focusActive)
  $('#focus-label').textContent = state.focusActive ? `Фокус активен · ${minutesLeft(state.focusUntil)} мин` : 'Включить фокус'
  $('#headline').innerHTML = state.focusActive ? 'Фокус<br><em>включён.</em>' : 'Меньше шума.<br><em>Больше тебя.</em>'
  $('#subline').textContent = state.focusActive ? 'Отвлекающие сайты заблокированы до конца сессии.' : 'Включи ручную сессию на 25 минут.'
  const schedule = state.schedules.find(x => x.active)
  $('#next-title').textContent = state.scheduleActive ? 'Автоматическая защита' : schedule?.title || 'Нет активных окон'
  $('#next-time').textContent = state.scheduleActive ? 'Сайты сейчас заблокированы' : schedule ? `${schedule.days.join ? 'По расписанию' : schedule.days} · ${schedule.start} — ${schedule.end}` : 'Добавь расписание в настройках'
}

function minutesLeft(until) { return Math.max(1, Math.ceil((until - Date.now()) / 60000)) }

async function refresh() { render(await send('get-state')) }

$('#focus-button').onclick = async () => {
  const state = await send('get-state')
  await send(state.focusActive ? 'stop-focus' : 'start-focus')
  refresh()
}
$('#dashboard').onclick = () => send('open-dashboard')
$('#protection-toggle').onclick = async () => {
  const state = await send('get-state')
  await chrome.storage.local.set({ enabled: state.enabled === false })
  refresh()
}
refresh()
setInterval(refresh, 30000)
