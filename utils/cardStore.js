const STORAGE_KEY = 'card_draft_v1'

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  const x = d instanceof Date ? d : new Date()
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

function timeKey(d) {
  const x = d instanceof Date ? d : new Date()
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`
}

function seedDraft() {
  const now = new Date()
  return {
    version: 1,
    photoPath: '',
    templateKey: 'birthday_1',
    doodle: {
      strokes: [],
      stickers: [],
      texts: [],
      brushColor: '#111111',
    },
    message: '',
    playMode: 'auto',
    scheduleEnabled: false,
    scheduleDate: dateKey(now),
    scheduleTime: timeKey(now),
    updatedAtTs: Date.now(),
  }
}

export function loadCardDraft() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedDraft()
    const draft = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!draft || typeof draft !== 'object') return seedDraft()
    if (!draft.doodle || typeof draft.doodle !== 'object') draft.doodle = seedDraft().doodle
    if (!Array.isArray(draft.doodle.strokes)) draft.doodle.strokes = []
    if (!Array.isArray(draft.doodle.stickers)) draft.doodle.stickers = []
    if (!Array.isArray(draft.doodle.texts)) draft.doodle.texts = []
    if (!draft.scheduleDate) draft.scheduleDate = seedDraft().scheduleDate
    if (!draft.scheduleTime) draft.scheduleTime = seedDraft().scheduleTime
    if (!draft.playMode) draft.playMode = 'auto'
    if (!draft.templateKey) draft.templateKey = seedDraft().templateKey
    if (typeof draft.scheduleEnabled !== 'boolean') draft.scheduleEnabled = false
    return draft
  } catch (e) {
    return seedDraft()
  }
}

export function saveCardDraft(draft) {
  const next = { ...(draft || {}), updatedAtTs: Date.now() }
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function ensureCardDraft() {
  const d = loadCardDraft()
  saveCardDraft(d)
  return d
}

export function clearCardDraft() {
  const d = seedDraft()
  saveCardDraft(d)
  return d
}

export function draftHasContent(draft) {
  const d = draft || {}
  const hasPhoto = !!(d.photoPath && String(d.photoPath).trim())
  const doodle = d.doodle || {}
  const hasDoodle = (doodle.strokes && doodle.strokes.length) || (doodle.stickers && doodle.stickers.length) || (doodle.texts && doodle.texts.length)
  return !!(hasPhoto || hasDoodle)
}

