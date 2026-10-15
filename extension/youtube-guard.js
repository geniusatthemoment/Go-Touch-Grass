// YouTube navigation can change the URL without making a main-frame request.
let blockingState = null
async function loadBlockingState() {
  blockingState = await chrome.storage.local.get({ enabled: true, sites: [], schedules: [], focusUntil: 0 })
  checkLocation()
}
function checkLocation() {
  if (!blockingState || blockingState.enabled === false) return
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const scheduled = blockingState.schedules.some(item => {
    if (!item.active || !item.days.includes(now.getDay())) return false
    const toMinutes = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m }
    const start = toMinutes(item.start), end = toMinutes(item.end)
    return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end
  })
  if (!(Number(blockingState.focusUntil) > Date.now() || scheduled)) return
  if (blockingState.sites.some(site => matchesTarget(location.href, site.domain))) location.replace(chrome.runtime.getURL('blocked.html'))
}
chrome.storage.onChanged.addListener(() => { loadBlockingState().catch(() => {}) })
document.addEventListener('yt-navigate-finish', checkLocation)
window.addEventListener('popstate', checkLocation)
// Also catches an already-open Shorts page when a scheduled window begins.
setInterval(checkLocation, 1000)
loadBlockingState().catch(() => {})
