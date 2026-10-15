const $ = selector => document.querySelector(selector)
const defaults = { enabled: true, sites: [], schedules: [] }

async function state() { return chrome.storage.local.get(defaults) }
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])) }

async function render() {
  const data = await state()
  $('#state-label').textContent = data.enabled === false ? 'Защита выключена' : 'Защита включена'
  $('.state').classList.toggle('off', data.enabled === false)
  $('#protection-title').textContent = data.enabled === false ? 'Защита выключена' : 'Защита включена'
  $('#protection-toggle').textContent = data.enabled === false ? 'Включить' : 'Отключить'
  $('#site-list').innerHTML = data.sites.length ? data.sites.map(site => `<div class="row"><span class="avatar">${esc(site.name[0] || '•')}</span><span class="row-main"><strong>${esc(site.name)}</strong><small>${esc(site.domain)}</small></span><span class="row-status">Блокируется</span><button class="remove" data-site="${esc(site.domain)}">×</button></div>`).join('') : '<p class="empty">Список пока пуст.</p>'
  $('#schedule-list').innerHTML = data.schedules.length ? data.schedules.map(item => `<div class="schedule-row"><span class="schedule-clock">◷</span><span class="row-main"><strong>${esc(item.title)}</strong><small>${esc(item.start)} — ${esc(item.end)}</small></span><button class="switch ${item.active ? 'on' : ''}" data-schedule="${item.id}"><span></span></button></div>`).join('') : '<p class="empty">Расписаний пока нет.</p>'
  document.querySelectorAll('[data-site]').forEach(button => button.onclick = async () => { const next = data.sites.filter(site => site.domain !== button.dataset.site); await chrome.storage.local.set({ sites: next }); render() })
  document.querySelectorAll('[data-schedule]').forEach(button => button.onclick = async () => { const next = data.schedules.map(item => item.id == button.dataset.schedule ? { ...item, active: !item.active } : item); await chrome.storage.local.set({ schedules: next }); render() })
  document.querySelectorAll('.schedule-row .row-main').forEach((row, index) => row.onclick = () => openModal('schedule', data.schedules[index]))
}

let modalMode = 'site'
let editingScheduleId = null
function openModal(mode, item = null) {
  modalMode = mode
  editingScheduleId = item?.id || null
  $('#modal-backdrop').hidden = false
  if (mode === 'site') {
    $('#modal-eyebrow').textContent = 'СПИСОК БЛОКИРОВКИ'
    $('#modal-title').textContent = 'Добавить сайт'
    $('#modal-fields').innerHTML = '<label class="field"><span>САЙТ ИЛИ РАЗДЕЛ</span><input id="modal-domain" required placeholder="например, youtube.com/shorts" autocomplete="off"></label>'
    $('#modal-domain').focus()
  } else {
    $('#modal-eyebrow').textContent = 'АВТОМАТИЗАЦИЯ'
    $('#modal-title').textContent = item ? 'Изменить расписание' : 'Новое расписание'
    $('#modal-fields').innerHTML = `<label class="field"><span>НАЗВАНИЕ</span><input id="modal-title-input" required placeholder="Например, Утренний фокус" value="${esc(item?.title || '')}"></label><label class="field"><span>ДНИ</span><select id="modal-days"><option value="weekdays">Пн — Пт</option><option value="everyday">Каждый день</option><option value="weekend">Сб — Вс</option></select></label><div class="time-fields"><label class="field"><span>НАЧАЛО</span><input id="modal-start" type="time" required value="${item?.start || '09:00'}"></label><label class="field"><span>КОНЕЦ</span><input id="modal-end" type="time" required value="${item?.end || '12:00'}"></label></div>`
    $('#modal-days').value = item?.days?.length === 7 ? 'everyday' : item?.days?.includes(0) ? 'weekend' : 'weekdays'
    $('#modal-title-input').focus()
  }
}
function closeModal() { $('#modal-backdrop').hidden = true; editingScheduleId = null }
function daysFromValue(value) { return value === 'everyday' ? [0,1,2,3,4,5,6] : value === 'weekend' ? [0,6] : [1,2,3,4,5] }

$('#protection-toggle').onclick = async () => { const data = await state(); await chrome.storage.local.set({ enabled: data.enabled === false }); render() }
$('#add-site').onclick = () => openModal('site')
$('#add-schedule').onclick = () => openModal('schedule')
$('#modal-close').onclick = closeModal
$('#modal-cancel').onclick = closeModal
$('#modal-backdrop').onclick = event => { if (event.target === $('#modal-backdrop')) closeModal() }
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#modal-backdrop').hidden) closeModal() })
$('#modal-form').onsubmit = async event => {
  event.preventDefault()
  const data = await state()
  if (modalMode === 'site') {
    const input = $('#modal-domain')
    let clean
    try { clean = normalizeTarget(input.value) } catch { input.setCustomValidity('Укажи домен или адрес раздела сайта'); input.reportValidity(); input.oninput = () => input.setCustomValidity(''); return }
    if (data.sites.some(site => normalizeTarget(site.domain) === clean)) { input.setCustomValidity('Этот адрес уже есть в списке'); input.reportValidity(); input.oninput = () => input.setCustomValidity(''); return }
    await chrome.storage.local.set({ sites: [...data.sites, { name: clean.split('.')[0].replace(/^./, x => x.toUpperCase()), domain: clean }] })
  } else {
    const item = { id: editingScheduleId || Date.now(), title: $('#modal-title-input').value.trim(), days: daysFromValue($('#modal-days').value), start: $('#modal-start').value, end: $('#modal-end').value, active: editingScheduleId ? data.schedules.find(x => x.id === editingScheduleId)?.active !== false : true }
    const schedules = editingScheduleId ? data.schedules.map(x => x.id === editingScheduleId ? item : x) : [...data.schedules, item]
    await chrome.storage.local.set({ schedules })
  }
  closeModal(); render()
}
render()
