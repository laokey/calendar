const STORAGE_KEY = 'list_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function seedState() {
  const shoppingId = uid('ls')
  const todoId = uid('ls')
  const now = Date.now()
  return {
    version: 1,
    showCompletedByList: { [shoppingId]: true, [todoId]: true },
    lists: [
      {
        id: shoppingId,
        title: '购物清单',
        color: '#4c8dff',
        createdAtTs: now,
        items: [
          { id: uid('it'), text: '小孩玩具', done: false, createdAtTs: now - 60000 },
          { id: uid('it'), text: '12点去市场买菜', done: false, createdAtTs: now - 50000 },
          { id: uid('it'), text: '帮爸爸带掉烟', done: false, createdAtTs: now - 40000 },
          { id: uid('it'), text: '帮爸爸带掉烟', done: true, createdAtTs: now - 30000, doneAtTs: now - 20000 },
          { id: uid('it'), text: '去超市', done: true, createdAtTs: now - 20000, doneAtTs: now - 10000 },
        ],
      },
      {
        id: todoId,
        title: '待办事项',
        color: '#ff5a5f',
        createdAtTs: now - 1000,
        items: [],
      },
    ],
  }
}

export function loadListState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object' || !Array.isArray(state.lists)) return seedState()
    if (!state.showCompletedByList || typeof state.showCompletedByList !== 'object') state.showCompletedByList = {}
    state.lists = state.lists
      .filter((l) => l && typeof l === 'object')
      .map((l) => ({
        id: String(l.id || uid('ls')),
        title: String(l.title || '').trim(),
        color: String(l.color || '#3d6afb'),
        createdAtTs: Number(l.createdAtTs || 0) || Date.now(),
        items: Array.isArray(l.items)
          ? l.items
              .filter((x) => x && typeof x === 'object')
              .map((x) => ({
                id: String(x.id || uid('it')),
                text: String(x.text || '').trim(),
                done: !!x.done,
                createdAtTs: Number(x.createdAtTs || 0) || Date.now(),
                doneAtTs: Number(x.doneAtTs || 0) || 0,
              }))
          : [],
      }))
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveListState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureListState() {
  const state = loadListState()
  saveListState(state)
  return state
}

export function listLists(state) {
  return (state.lists || []).slice().sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0))
}

export function findList(state, id) {
  return (state.lists || []).find((l) => l.id === id) || null
}

export function addList(state, { title, color }) {
  const t = String(title || '').trim()
  if (!t) return null
  const list = { id: uid('ls'), title: t, color: color || '#3d6afb', createdAtTs: Date.now(), items: [] }
  state.lists = [list, ...(state.lists || [])]
  state.showCompletedByList[list.id] = true
  saveListState(state)
  return list
}

export function updateList(state, id, patch) {
  const idx = (state.lists || []).findIndex((l) => l.id === id)
  if (idx < 0) return false
  const cur = state.lists[idx]
  const next = { ...cur, ...(patch || {}) }
  next.title = String(next.title || '').trim()
  next.color = String(next.color || cur.color || '#3d6afb')
  state.lists[idx] = next
  saveListState(state)
  return true
}

export function deleteList(state, id) {
  state.lists = (state.lists || []).filter((l) => l.id !== id)
  if (state.showCompletedByList && Object.prototype.hasOwnProperty.call(state.showCompletedByList, id)) {
    const { [id]: _, ...rest } = state.showCompletedByList
    state.showCompletedByList = rest
  }
  saveListState(state)
}

export function listItems(state, listId) {
  const list = findList(state, listId)
  if (!list) return []
  return (list.items || []).slice().sort((a, b) => (a.createdAtTs || 0) - (b.createdAtTs || 0))
}

export function addListItem(state, listId, text) {
  const list = findList(state, listId)
  if (!list) return null
  const t = String(text || '').trim()
  if (!t) return null
  const item = { id: uid('it'), text: t, done: false, createdAtTs: Date.now(), doneAtTs: 0 }
  list.items = [...(list.items || []), item]
  saveListState(state)
  return item
}

export function updateListItem(state, listId, itemId, patch) {
  const list = findList(state, listId)
  if (!list) return false
  const idx = (list.items || []).findIndex((x) => x.id === itemId)
  if (idx < 0) return false
  list.items[idx] = { ...list.items[idx], ...(patch || {}) }
  list.items[idx].text = String(list.items[idx].text || '').trim()
  saveListState(state)
  return true
}

export function deleteListItem(state, listId, itemId) {
  const list = findList(state, listId)
  if (!list) return
  list.items = (list.items || []).filter((x) => x.id !== itemId)
  saveListState(state)
}

export function toggleListItemDone(state, listId, itemId) {
  const list = findList(state, listId)
  if (!list) return false
  const idx = (list.items || []).findIndex((x) => x.id === itemId)
  if (idx < 0) return false
  const cur = list.items[idx]
  const nextDone = !cur.done
  list.items[idx] = { ...cur, done: nextDone, doneAtTs: nextDone ? Date.now() : 0 }
  saveListState(state)
  return true
}

export function listStats(state, listId) {
  const items = listItems(state, listId)
  const done = items.filter((x) => x.done).length
  const total = items.length
  return { total, done, undone: total - done }
}

export function getShowCompleted(state, listId) {
  const v = state.showCompletedByList ? state.showCompletedByList[listId] : undefined
  return typeof v === 'boolean' ? v : true
}

export function setShowCompleted(state, listId, show) {
  if (!state.showCompletedByList || typeof state.showCompletedByList !== 'object') state.showCompletedByList = {}
  state.showCompletedByList[listId] = !!show
  saveListState(state)
  return state
}

