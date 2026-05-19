const STORAGE_KEY = 'task_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseKey(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return new Date()
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

function toCnDateText(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

function weekdayText(d) {
  const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return map[d.getDay()]
}

function formatMdCn(key) {
  const parts = String(key || '').split('-')
  if (parts.length !== 3) return ''
  return `${pad(Number(parts[1]))}月${pad(Number(parts[2]))}日`
}

function minutesDiff(nowTs, dueTs) {
  return Math.floor((nowTs - dueTs) / 60000)
}

function dueTimestamp(task) {
  if (!task || !task.dateEnabled) return null
  const d = parseKey(task.date)
  d.setHours(0, 0, 0, 0)
  if (task.timeEnabled && task.time) {
    const parts = String(task.time).split(':')
    if (parts.length === 2) {
      d.setHours(Number(parts[0]) || 0, Number(parts[1]) || 0, 0, 0)
    }
  }
  return d.getTime()
}

function seedState() {
  const cursor = new Date(2026, 3, 5)
  const d1 = dateKey(cursor)
  const d2 = dateKey(new Date(2026, 3, 4))

  const t1 = {
    id: uid('tk'),
    title: '钢琴课',
    emoji: '',
    dateEnabled: true,
    date: d1,
    timeEnabled: true,
    time: '17:25',
    repeat: { unit: 'day', every: 1, id: uid('rp') },
    hearts: 10,
    priority: 'low',
    memberId: 'sis',
    completedAtTs: 0,
    createdAtTs: Date.now(),
  }
  const t2 = {
    id: uid('tk'),
    title: '钢琴课',
    emoji: '',
    dateEnabled: true,
    date: d1,
    timeEnabled: true,
    time: '17:00',
    repeat: null,
    hearts: 10,
    priority: 'low',
    memberId: 'sis',
    completedAtTs: 0,
    createdAtTs: Date.now() - 60000,
  }
  const t3 = {
    id: uid('tk'),
    title: '写作业',
    emoji: '',
    dateEnabled: true,
    date: d2,
    timeEnabled: true,
    time: '17:25',
    repeat: null,
    hearts: 10,
    priority: 'high',
    memberId: 'me',
    completedAtTs: Date.now() - 3600000,
    createdAtTs: Date.now() - 120000,
  }

  return {
    version: 1,
    cursorDate: d1,
    calendarOpen: false,
    settings: {
      sort: 'time',
      showDone: true,
      showOverdue: true,
    },
    tasks: [t1, t2, t3],
  }
}

export function loadTaskState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.tasks) || !state.settings) return seedState()
    if (!state.cursorDate) state.cursorDate = seedState().cursorDate
    if (!state.settings.sort) state.settings.sort = 'time'
    if (typeof state.settings.showDone !== 'boolean') state.settings.showDone = true
    if (typeof state.settings.showOverdue !== 'boolean') state.settings.showOverdue = true
    if (typeof state.calendarOpen !== 'boolean') state.calendarOpen = false
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveTaskState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureTaskState() {
  const state = loadTaskState()
  saveTaskState(state)
  return state
}

export function setTaskCursorDate(state, key) {
  state.cursorDate = key
  saveTaskState(state)
  return state
}

export function setTaskCalendarOpen(state, open) {
  state.calendarOpen = !!open
  saveTaskState(state)
  return state
}

export function updateTaskSettings(state, patch) {
  state.settings = { ...(state.settings || {}), ...(patch || {}) }
  saveTaskState(state)
  return state
}

export function listTasks(state) {
  return (state.tasks || []).slice()
}

export function findTask(state, id) {
  return (state.tasks || []).find((t) => t.id === id) || null
}

export function addTask(state, payload) {
  const t = {
    id: uid('tk'),
    title: String(payload.title || '').trim(),
    emoji: String(payload.emoji || ''),
    dateEnabled: !!payload.dateEnabled,
    date: payload.dateEnabled ? String(payload.date || state.cursorDate) : '',
    timeEnabled: !!payload.timeEnabled,
    time: payload.timeEnabled ? String(payload.time || '') : '',
    repeat: payload.repeat || null,
    hearts: Number(payload.hearts || 0) || 0,
    priority: payload.priority || 'none',
    memberId: payload.memberId || 'me',
    completedAtTs: 0,
    createdAtTs: Date.now(),
  }
  state.tasks = [t, ...(state.tasks || [])]
  saveTaskState(state)
  return t
}

export function updateTask(state, id, patch) {
  const list = state.tasks || []
  const idx = list.findIndex((t) => t.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], ...(patch || {}) }
  saveTaskState(state)
  return true
}

export function deleteTask(state, id, scope) {
  const t = findTask(state, id)
  if (!t) return
  if (!scope || scope === 'one' || !t.repeat || !t.repeat.id) {
    state.tasks = (state.tasks || []).filter((x) => x.id !== id)
    saveTaskState(state)
    return
  }
  const rid = t.repeat.id
  if (scope === 'all') {
    state.tasks = (state.tasks || []).filter((x) => !(x.repeat && x.repeat.id === rid))
    saveTaskState(state)
    return
  }
  if (scope === 'future') {
    const base = t.date || ''
    state.tasks = (state.tasks || []).filter((x) => {
      if (!x.repeat || x.repeat.id !== rid) return true
      if (!x.date) return true
      return x.date < base
    })
    saveTaskState(state)
  }
}

export function markTaskDone(state, id) {
  const ok = updateTask(state, id, { completedAtTs: Date.now() })
  return ok
}

export function markTaskUndone(state, id) {
  const ok = updateTask(state, id, { completedAtTs: 0 })
  return ok
}

export function isTaskDone(task) {
  return !!(task && task.completedAtTs)
}

export function isTaskOverdue(task, nowTs) {
  if (!task || isTaskDone(task)) return false
  const due = dueTimestamp(task)
  if (!due) return false
  return due < (nowTs || Date.now())
}

export function taskOverdueText(task, nowTs) {
  const due = dueTimestamp(task)
  if (!due) return ''
  const mins = minutesDiff(nowTs || Date.now(), due)
  if (mins <= 0) return ''
  return `逾期${mins}分钟`
}

export function taskDateTitle(key) {
  return formatMdCn(key)
}

export function taskDetailDateText(task) {
  if (!task || !task.dateEnabled || !task.date) return ''
  const d = parseKey(task.date)
  const wd = weekdayText(d)
  const t = task.timeEnabled && task.time ? `，${task.time}` : ''
  return `${toCnDateText(task.date)} ${wd}${t}`
}

export function taskSortKey(task, sortMode) {
  if (sortMode === 'priority') {
    const map = { high: 0, mid: 1, low: 2, none: 3 }
    return `${map[task.priority] ?? 9}_${task.timeEnabled ? task.time : '99:99'}_${task.createdAtTs || 0}`
  }
  if (sortMode === 'created') {
    return `${String(task.createdAtTs || 0).padStart(13, '0')}`
  }
  const t = task.timeEnabled && task.time ? task.time : '99:99'
  return `${t}_${String(task.createdAtTs || 0).padStart(13, '0')}`
}

export function tasksForDate(state, key, { memberId } = {}) {
  const nowTs = Date.now()
  const showOverdue = !!(state.settings && state.settings.showOverdue)
  const list = (state.tasks || []).filter((t) => {
    if (t.dateEnabled && t.date !== key) return false
    if (!t.dateEnabled) return false
    if (memberId && memberId !== 'all') {
      if (t.memberId !== memberId) return false
    }
    if (!showOverdue) {
      const due = dueTimestamp(t)
      if (due && due < nowTs) {
        const todayKey = dateKey(new Date(nowTs))
        if (t.date !== todayKey) return false
      }
    }
    return true
  })

  const sortMode = (state.settings && state.settings.sort) || 'time'
  return list.slice().sort((a, b) => String(taskSortKey(a, sortMode)).localeCompare(String(taskSortKey(b, sortMode))))
}

export function taskStatsForDate(state, key, memberId) {
  const list = tasksForDate(state, key, { memberId: memberId || 'all' })
  const done = list.filter((t) => isTaskDone(t)).length
  const total = list.length
  const hearts = list.filter((t) => isTaskDone(t)).reduce((sum, t) => sum + (Number(t.hearts || 0) || 0), 0)
  return { done, total, hearts }
}

export function reassignTasksByMember(state, fromMemberId, toMemberId) {
  const fromId = String(fromMemberId || '')
  const toId = String(toMemberId || '')
  if (!fromId || !toId || fromId === toId) return state
  state.tasks = (state.tasks || []).map((t) => (t && t.memberId === fromId ? { ...t, memberId: toId } : t))
  saveTaskState(state)
  return state
}

export function deleteTasksByMember(state, memberId) {
  const mid = String(memberId || '')
  if (!mid) return state
  state.tasks = (state.tasks || []).filter((t) => !(t && t.memberId === mid))
  saveTaskState(state)
  return state
}
