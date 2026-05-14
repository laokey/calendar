const STORAGE_KEY = 'reward_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayKey(ts) {
  const d = ts ? new Date(ts) : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function seedState() {
  return {
    version: 1,
    activeType: 'reward',
    activeMemberId: 'me',
    settings: { sort: 'asc', showDone: true },
    items: [
      {
        id: uid('rw'),
        type: 'reward',
        title: '跑步机跑步30分钟',
        emoji: '力',
        hearts: 10,
        resetAfter: false,
        memberId: 'me',
        desc: '',
        lastActionDate: '',
        createdAtTs: Date.now(),
      },
      {
        id: uid('rw'),
        type: 'reward',
        title: '健身50分钟',
        emoji: '❤',
        hearts: 10,
        resetAfter: true,
        memberId: 'me',
        desc: '',
        lastActionDate: '',
        createdAtTs: Date.now() - 50000,
      },
      {
        id: uid('rw'),
        type: 'reward',
        title: '健身30分钟',
        emoji: '❤',
        hearts: 10,
        resetAfter: true,
        memberId: 'me',
        desc: '',
        lastActionDate: todayKey(),
        createdAtTs: Date.now() - 90000,
      },
      {
        id: uid('rw'),
        type: 'punish',
        title: '瑜伽一节课',
        emoji: '笑',
        hearts: 10,
        resetAfter: false,
        memberId: 'sis',
        desc: '惩罚',
        lastActionDate: '',
        createdAtTs: Date.now() - 150000,
      },
      {
        id: uid('rw'),
        type: 'punish',
        title: '跑步机跑步30分钟',
        emoji: '力',
        hearts: 10,
        resetAfter: false,
        memberId: 'sis',
        desc: '惩罚',
        lastActionDate: '',
        createdAtTs: Date.now() - 160000,
      },
    ],
    transfers: [
      { id: uid('tr'), memberId: 'mom', delta: 11, reason: 'seed', createdAtTs: Date.now() - 7200000 },
      { id: uid('tr'), memberId: 'mom', delta: 0, reason: 'seed', createdAtTs: Date.now() - 7100000 },
    ],
  }
}

export function loadRewardState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.items) || !Array.isArray(state.transfers)) return seedState()
    if (!state.settings) state.settings = { sort: 'asc', showDone: true }
    if (!state.settings.sort) state.settings.sort = 'asc'
    if (typeof state.settings.showDone !== 'boolean') state.settings.showDone = true
    if (!state.activeType) state.activeType = 'reward'
    if (!state.activeMemberId) state.activeMemberId = 'me'
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveRewardState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureRewardState() {
  const state = loadRewardState()
  saveRewardState(state)
  return state
}

export function updateRewardSettings(state, patch) {
  state.settings = { ...(state.settings || {}), ...(patch || {}) }
  saveRewardState(state)
  return state
}

export function setRewardActiveType(state, type) {
  state.activeType = type === 'punish' ? 'punish' : 'reward'
  saveRewardState(state)
  return state
}

export function setRewardActiveMember(state, memberId) {
  state.activeMemberId = memberId || 'me'
  saveRewardState(state)
  return state
}

export function listRewardItems(state) {
  return (state.items || []).slice()
}

export function findRewardItem(state, id) {
  return (state.items || []).find((x) => x.id === id) || null
}

export function addRewardItem(state, payload) {
  const item = {
    id: uid('rw'),
    type: payload.type === 'punish' ? 'punish' : 'reward',
    title: String(payload.title || '').trim(),
    emoji: String(payload.emoji || ''),
    hearts: Number(payload.hearts || 0) || 0,
    resetAfter: !!payload.resetAfter,
    memberId: payload.memberId || 'me',
    desc: String(payload.desc || ''),
    lastActionDate: '',
    createdAtTs: Date.now(),
  }
  state.items = [item, ...(state.items || [])]
  saveRewardState(state)
  return item
}

export function updateRewardItem(state, id, patch) {
  const list = state.items || []
  const idx = list.findIndex((x) => x.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], ...(patch || {}) }
  saveRewardState(state)
  return true
}

export function deleteRewardItem(state, id) {
  state.items = (state.items || []).filter((x) => x.id !== id)
  saveRewardState(state)
}

export function addHeartTransfer(state, { memberId, delta, reason }) {
  const tr = { id: uid('tr'), memberId, delta: Number(delta || 0) || 0, reason: String(reason || ''), createdAtTs: Date.now() }
  state.transfers = [tr, ...(state.transfers || [])]
  saveRewardState(state)
  return tr
}

export function isItemDoneToday(item, nowKey) {
  const key = nowKey || todayKey()
  return !!(item && item.lastActionDate === key)
}

export function redeemItem(state, itemId, { nowKey } = {}) {
  const item = findRewardItem(state, itemId)
  if (!item) return { ok: false, reason: 'not_found' }
  const key = nowKey || todayKey()
  if (isItemDoneToday(item, key)) return { ok: false, reason: 'done_today' }
  const cost = Number(item.hearts || 0) || 0
  addHeartTransfer(state, { memberId: item.memberId, delta: -cost, reason: `${item.type}:${item.id}` })
  updateRewardItem(state, itemId, { lastActionDate: key })
  return { ok: true, item }
}

export function listTransfers(state) {
  return (state.transfers || []).slice()
}

export function todayDateKey() {
  return todayKey()
}

export function computeEarnedHeartsFromTasks(memberId) {
  try {
    const raw = uni.getStorageSync('task_state_v1')
    const state = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const tasks = state && Array.isArray(state.tasks) ? state.tasks : []
    return tasks
      .filter((t) => t && t.completedAtTs && t.memberId === memberId)
      .reduce((sum, t) => sum + (Number(t.hearts || 0) || 0), 0)
  } catch (e) {
    return 0
  }
}

export function computeHeartBalance(state, memberId) {
  const earned = computeEarnedHeartsFromTasks(memberId)
  const transfers = (state.transfers || []).filter((t) => t.memberId === memberId).reduce((sum, t) => sum + (Number(t.delta || 0) || 0), 0)
  return earned + transfers
}
