const STORAGE_KEY = 'calendar_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function memberGlyphFromName(name) {
  const n = String(name || '').trim()
  if (!n) return ''
  return n.length >= 2 ? n.slice(-2, -1) : n.slice(0, 1)
}

function guessMemberGroup(m) {
  const id = m && m.id ? String(m.id) : ''
  const name = m && m.name ? String(m.name) : ''
  if (id === 'neighbor' || id === 'sis2' || name.includes('邻')) return 'calendarColor'
  return 'member'
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  return `${y}-${m}-${day}`
}

function fromDateKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return new Date()
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function addDays(d, days) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function startOfWeek(d) {
  const x = new Date(d)
  const dow = x.getDay()
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - dow)
  return x
}

function endOfWeek(d) {
  return addDays(startOfWeek(d), 6)
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function formatRange(a, b) {
  const aM = pad(a.getMonth() + 1)
  const aD = pad(a.getDate())
  const bM = pad(b.getMonth() + 1)
  const bD = pad(b.getDate())
  return `${aM}.${aD}–${bM}.${bD}`
}

function weekdayText(d) {
  const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return map[d.getDay()]
}

function toCnDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function seedState() {
  const members = [
    { id: 'dad', name: '爸爸', glyph: '爸', color: '#4cc38a', enabled: true, group: 'member', avatarUrl: '' },
    { id: 'mom', name: '妈妈', glyph: '妈', color: '#9b59ff', enabled: true, group: 'member', avatarUrl: '' },
    { id: 'sis', name: '姐姐', glyph: '姐', color: '#ff5a5f', enabled: true, group: 'member', avatarUrl: '' },
    { id: 'bro', name: '弟弟', glyph: '弟', color: '#4c8dff', enabled: true, group: 'member', avatarUrl: '' },
    { id: 'uncle', name: '外公', glyph: '外', color: '#7cc7ff', enabled: true, group: 'member', avatarUrl: '' },
    { id: 'bigSis', name: '大姐', glyph: '大', color: '#ffb020', enabled: false, group: 'member', avatarUrl: '' },
    { id: 'neighbor', name: '邻居', glyph: '邻', color: '#ff4bd8', enabled: true, group: 'calendarColor', avatarUrl: '' },
    { id: 'sis2', name: '二姐', glyph: '二', color: '#ff4b3f', enabled: true, group: 'calendarColor', avatarUrl: '' },
  ]

  const base = new Date(2026, 0, 1)
  const e1 = {
    id: uid('ev'),
    title: '写作业',
    allDay: false,
    startDate: dateKey(addDays(base, -2)),
    startTime: '17:25',
    endDate: dateKey(addDays(base, -2)),
    endTime: '18:24',
    repeat: null,
    memberIds: ['bro'],
    color: '#eaf2ff',
    tagColor: '#4c8dff',
    desc: '',
    location: '',
    createdAtTs: Date.now(),
  }
  const e2 = {
    id: uid('ev'),
    title: '钢琴课',
    allDay: false,
    startDate: dateKey(addDays(base, -1)),
    startTime: '17:25',
    endDate: dateKey(addDays(base, -1)),
    endTime: '18:24',
    repeat: null,
    memberIds: ['sis'],
    color: '#fdecee',
    tagColor: '#ff5a5f',
    desc: '',
    location: '',
    createdAtTs: Date.now(),
  }
  const e3 = {
    id: uid('ev'),
    title: '健身',
    allDay: false,
    startDate: dateKey(addDays(base, -1)),
    startTime: '17:25',
    endDate: dateKey(addDays(base, -1)),
    endTime: '18:24',
    repeat: null,
    memberIds: ['dad'],
    color: '#eaf7f1',
    tagColor: '#4cc38a',
    desc: '',
    location: '',
    createdAtTs: Date.now(),
  }
  const e4 = {
    id: uid('ev'),
    title: '家庭聚会',
    allDay: false,
    startDate: dateKey(addDays(base, 0)),
    startTime: '17:25',
    endDate: dateKey(addDays(base, 0)),
    endTime: '18:24',
    repeat: null,
    memberIds: ['bro', 'sis', 'mom', 'dad'],
    color: '#ffffff',
    tagColor: '#3d6afb',
    desc: '',
    location: '',
    createdAtTs: Date.now(),
  }
  const e5 = {
    id: uid('ev'),
    title: '修剪植物',
    allDay: false,
    startDate: dateKey(addDays(base, 0)),
    startTime: '17:25',
    endDate: dateKey(addDays(base, 0)),
    endTime: '18:24',
    repeat: null,
    memberIds: ['dad'],
    color: '#eaf7f1',
    tagColor: '#4cc38a',
    desc: '',
    location: '',
    createdAtTs: Date.now(),
  }

  return {
    version: 1,
    cursorDate: dateKey(base),
    viewMode: 'month',
    members,
    events: [e1, e2, e3, e4, e5],
  }
}

export function loadCalendarState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.members) || !Array.isArray(state.events)) return seedState()
    state.members = state.members.map((m) => ({
      ...m,
      enabled: typeof m.enabled === 'boolean' ? m.enabled : true,
      group: m && (m.group === 'calendarColor' || m.group === 'member') ? m.group : guessMemberGroup(m),
      avatarUrl: typeof m?.avatarUrl === 'string' ? m.avatarUrl : '',
    }))
    if (!state.cursorDate) state.cursorDate = seedState().cursorDate
    if (!state.viewMode) state.viewMode = 'month'
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveCalendarState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureCalendarState() {
  const state = loadCalendarState()
  saveCalendarState(state)
  return state
}

export function setCalendarViewMode(state, mode) {
  state.viewMode = mode === 'week' ? 'week' : 'month'
  saveCalendarState(state)
  return state
}

export function setCalendarCursorDate(state, key) {
  state.cursorDate = key
  saveCalendarState(state)
  return state
}

export function listMembers(state) {
  return (state.members || []).slice()
}

export function addMember(state, { name, color, avatarUrl }) {
  const n = String(name || '').trim()
  if (!n) return null
  const glyph = memberGlyphFromName(n)
  const member = {
    id: uid('mem'),
    name: n,
    glyph,
    color: color || '#3d6afb',
    enabled: true,
    group: 'member',
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : '',
  }
  state.members = [...(state.members || []), member]
  saveCalendarState(state)
  return member
}

export function findMember(state, id) {
  return (state.members || []).find((m) => m.id === id) || null
}

export function updateMember(state, id, patch) {
  const list = state.members || []
  const idx = list.findIndex((m) => m.id === id)
  if (idx < 0) return false
  const prev = list[idx]
  const next = { ...prev, ...(patch || {}) }
  if (typeof next.name === 'string') {
    const n = String(next.name || '').trim()
    next.name = n
    next.glyph = memberGlyphFromName(n)
  }
  if (typeof next.avatarUrl !== 'string') next.avatarUrl = ''
  next.enabled = typeof next.enabled === 'boolean' ? next.enabled : true
  next.group = next.group === 'calendarColor' ? 'calendarColor' : 'member'
  list[idx] = next
  saveCalendarState(state)
  return true
}

export function setMembers(state, members) {
  state.members = Array.isArray(members) ? members.slice() : []
  saveCalendarState(state)
  return state
}

export function deleteMember(state, id) {
  state.members = (state.members || []).filter((m) => m.id !== id)
  saveCalendarState(state)
  return state
}

export function setMemberEnabled(state, id, enabled) {
  const list = state.members || []
  const idx = list.findIndex((m) => m.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], enabled: !!enabled }
  saveCalendarState(state)
  return true
}

export function listEvents(state) {
  return (state.events || []).slice().sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0))
}

export function reassignEventsByMember(state, fromMemberId, toMemberId) {
  const fromId = String(fromMemberId || '')
  const toId = String(toMemberId || '')
  if (!fromId || !toId || fromId === toId) return state
  state.events = (state.events || []).map((e) => {
    const ids = Array.isArray(e.memberIds) ? e.memberIds.slice() : []
    if (!ids.includes(fromId)) return e
    const out = ids.filter((x) => x !== fromId)
    if (!out.includes(toId)) out.push(toId)
    return { ...e, memberIds: out }
  })
  saveCalendarState(state)
  return state
}

export function deleteEventsByMember(state, memberId) {
  const mid = String(memberId || '')
  if (!mid) return state
  state.events = (state.events || [])
    .map((e) => {
      const ids = Array.isArray(e.memberIds) ? e.memberIds.slice() : []
      if (!ids.includes(mid)) return e
      const out = ids.filter((x) => x !== mid)
      return { ...e, memberIds: out }
    })
    .filter((e) => {
      const ids = Array.isArray(e.memberIds) ? e.memberIds : []
      return ids.length > 0
    })
  saveCalendarState(state)
  return state
}

export function findEvent(state, id) {
  return (state.events || []).find((e) => e.id === id) || null
}

export function addEvent(state, event) {
  const e = { ...event, id: uid('ev'), createdAtTs: Date.now() }
  state.events = [e, ...(state.events || [])]
  saveCalendarState(state)
  return e
}

export function updateEvent(state, id, patch) {
  const list = state.events || []
  const idx = list.findIndex((e) => e.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], ...(patch || {}) }
  saveCalendarState(state)
  return true
}

export function deleteEvent(state, id) {
  state.events = (state.events || []).filter((e) => e.id !== id)
  saveCalendarState(state)
}

export function eventsForDate(state, key) {
  const list = state.events || []
  return list
    .filter((e) => e.startDate === key)
    .slice()
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
}

export function monthMatrix(cursorKey) {
  const cursor = fromDateKey(cursorKey)
  const first = startOfMonth(cursor)
  const last = endOfMonth(cursor)
  const start = startOfWeek(first)
  const end = endOfWeek(last)
  const days = []
  let cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  const rows = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}

export function weekDays(cursorKey) {
  const cursor = fromDateKey(cursorKey)
  const start = startOfWeek(cursor)
  const out = []
  for (let i = 0; i < 7; i++) out.push(addDays(start, i))
  return out
}

export function weekRangeText(cursorKey) {
  const cursor = fromDateKey(cursorKey)
  return formatRange(startOfWeek(cursor), endOfWeek(cursor))
}

export function monthRangeText(cursorKey) {
  const cursor = fromDateKey(cursorKey)
  const first = startOfMonth(cursor)
  const last = endOfMonth(cursor)
  return formatRange(first, last)
}

export function dayLabel(d) {
  return { weekday: weekdayText(d), date: d.getDate() }
}

export function eventDateText(event) {
  const start = fromDateKey(event.startDate)
  const weekday = weekdayText(start)
  const dateText = `${toCnDate(start)} ${weekday}`
  if (event.allDay) return `${dateText}：全天`
  return `${dateText}：${event.startTime || ''}–${event.endTime || ''}`
}
