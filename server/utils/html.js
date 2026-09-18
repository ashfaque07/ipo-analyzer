// HTML / entity decoding helpers.

export function decodeEntities(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&#8377;/g, '₹')
    .replace(/&#128293;/g, '🔥')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export function stripTags(s) {
  return decodeEntities(String(s || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}
