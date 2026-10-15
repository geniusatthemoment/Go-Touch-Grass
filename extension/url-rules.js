function normalizeTarget(value) {
  const raw = String(value || '').trim()
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) throw new Error('Укажи домен или адрес раздела сайта')
  return url.hostname.toLowerCase().replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')
}
function targetRegex(value) {
  const target = normalizeTarget(value)
  const slash = target.indexOf('/')
  const host = slash < 0 ? target : target.slice(0, slash)
  const path = slash < 0 ? '' : target.slice(slash)
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return '^https?://([a-z0-9-]+\\.)*' + escape(host) + '(:[0-9]+)?' + (path ? escape(path) + '([/?#]|$)' : '([/?#]|$)')
}
function matchesTarget(url, target) {
  try { return new RegExp(targetRegex(target)).test(url) } catch { return false }
}
