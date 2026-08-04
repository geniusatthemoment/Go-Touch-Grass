const DYNAMIC_RULE_ID_START = 1000
const FOCUS_DURATION_MINUTES = 25

const defaultState = {
  enabled: true,
  sites: [
    { name: 'YouTube', domain: 'youtube.com' },
    { name: 'TikTok', domain: 'tiktok.com' },
    { name: 'Reddit', domain: 'reddit.com' },
    { name: 'Telegram Web', domain: 'web.telegram.org' }
  ],
  schedules: [
    { id: 1, title: 'Глубокая работа', days: [1, 2, 3, 4, 5], start: '09:00', end: '12:00', active: true },
    { id: 2, title: 'Вечер без ленты', days: [0, 1, 2, 3, 4, 5, 6], start: '21:30', end: '07:30', active: true }
  ],
  focusUntil: 0
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(defaultState)
  await chrome.storage.local.set(current)
  await chrome.alarms.create('schedule-tick', { periodInMinutes: 1 })
  await refreshBlocking()
})

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create('schedule-tick', { periodInMinutes: 1 })
  await refreshBlocking()
})

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'focus-end' || alarm.name === 'schedule-tick') await refreshBlocking()
})

chrome.storage.onChanged.addListener(refreshBlocking)

async function readState() {
  return chrome.storage.local.get(defaultState)
}

function currentTimeIsScheduled(schedules) {
  const now = new Date()
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return schedules.some(schedule => {
    if (!schedule.active || !schedule.days.includes(day)) return false
    const [startHour, startMinute] = schedule.start.split(':').map(Number)
    const [endHour, endMinute] = schedule.end.split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute
    return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end
  })
}

async function refreshBlocking() {
  const state = await readState()
  const focusActive = Number(state.focusUntil) > Date.now()
  const scheduleActive = currentTimeIsScheduled(state.schedules || [])
  const shouldBlock = state.enabled !== false && (focusActive || scheduleActive)
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeRuleIds = existing.map(rule => rule.id).filter(id => id >= DYNAMIC_RULE_ID_START)
  const addRules = shouldBlock ? (state.sites || []).map((site, index) => ({
    id: DYNAMIC_RULE_ID_START + index,
    priority: 1,
    action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
    condition: { urlFilter: `||${cleanDomain(site.domain)}^`, resourceTypes: ['main_frame'] }
  })) : []
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules })
  if (focusActive) await chrome.alarms.create('focus-end', { when: Number(state.focusUntil) })
}

function cleanDomain(domain) {
  return String(domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
}

async function startFocus() {
  const focusUntil = Date.now() + FOCUS_DURATION_MINUTES * 60 * 1000
  await chrome.storage.local.set({ focusUntil })
  await refreshBlocking()
  return { focusUntil }
}

async function stopFocus() {
  await chrome.storage.local.set({ focusUntil: 0 })
  await chrome.alarms.clear('focus-end')
  await refreshBlocking()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    if (message.type === 'get-state') {
      const state = await readState()
      sendResponse({ ...state, scheduleActive: currentTimeIsScheduled(state.schedules || []), focusActive: Number(state.focusUntil) > Date.now() })
    }
    if (message.type === 'start-focus') sendResponse(await startFocus())
    if (message.type === 'stop-focus') { await stopFocus(); sendResponse({ focusUntil: 0 }) }
    if (message.type === 'open-dashboard') chrome.tabs.create({ url: chrome.runtime.getURL('home.html') })
  })().catch(error => sendResponse({ error: error.message }))
  return true
})
