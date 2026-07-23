const STORAGE_KEY = 'meal_state_v1'
const TMP_SELECT_KEY = 'meal_recipe_select_tmp_v1'

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

function startOfWeek(d) {
  const x = new Date(d)
  const dow = x.getDay()
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - dow)
  return x
}

function addDays(d, days) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function weekdayText(d) {
  const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return map[d.getDay()]
}

function seedState() {
  const now = Date.now()
  const breakfastId = uid('cat')
  const lunchId = uid('cat')
  const dinnerId = uid('cat')
  const snackId = uid('cat')

  const categories = [
    { id: breakfastId, name: '早餐', glyph: '早', color: '#ff5a5f', enabled: true, createdAtTs: now - 4000 },
    { id: lunchId, name: '午餐', glyph: '午', color: '#4cc38a', enabled: true, createdAtTs: now - 3000 },
    { id: dinnerId, name: '晚餐', glyph: '晚', color: '#4c8dff', enabled: true, createdAtTs: now - 2000 },
    { id: snackId, name: '点心', glyph: '点', color: '#f0ad4e', enabled: true, createdAtTs: now - 1000 },
  ]

  const recipes = [
    { id: uid('rc'), title: '米饭', categoryId: lunchId, photoPath: '', note: '', createdAtTs: now - 200000 },
    { id: uid('rc'), title: '辣椒炒肉', categoryId: dinnerId, photoPath: '', note: '', createdAtTs: now - 190000 },
    { id: uid('rc'), title: '紫菜蛋花汤', categoryId: lunchId, photoPath: '', note: '', createdAtTs: now - 180000 },
    { id: uid('rc'), title: '豆浆', categoryId: breakfastId, photoPath: '', note: '', createdAtTs: now - 170000 },
    { id: uid('rc'), title: '玉米', categoryId: breakfastId, photoPath: '', note: '', createdAtTs: now - 160000 },
    { id: uid('rc'), title: '茶叶蛋', categoryId: snackId, photoPath: '', note: '', createdAtTs: now - 150000 },
    { id: uid('rc'), title: '烧烤', categoryId: dinnerId, photoPath: '', note: '', createdAtTs: now - 140000 },
    { id: uid('rc'), title: '酸菜鱼', categoryId: dinnerId, photoPath: '', note: '', createdAtTs: now - 130000 },
    { id: uid('rc'), title: '麻辣水煮鱼片', categoryId: dinnerId, photoPath: '', note: '', createdAtTs: now - 120000 },
  ]

  const weekStart = startOfWeek(new Date(2026, 2, 29))
  const day0 = dateKey(weekStart)
  const day1 = dateKey(addDays(weekStart, 1))
  const day2 = dateKey(addDays(weekStart, 2))

  const planEntries = [
    { id: uid('pl'), date: day1, categoryId: lunchId, recipeId: recipes[0].id, note: '', repeat: false, createdAtTs: now - 90000 },
    { id: uid('pl'), date: day1, categoryId: lunchId, recipeId: recipes[1].id, note: '', repeat: false, createdAtTs: now - 89000 },
    { id: uid('pl'), date: day1, categoryId: lunchId, recipeId: recipes[2].id, note: '', repeat: false, createdAtTs: now - 88000 },
    { id: uid('pl'), date: day2, categoryId: breakfastId, recipeId: recipes[3].id, note: '', repeat: false, createdAtTs: now - 87000 },
    { id: uid('pl'), date: day2, categoryId: breakfastId, recipeId: recipes[4].id, note: '', repeat: false, createdAtTs: now - 86000 },
  ]

  return {
    version: 1,
    weekStartKey: day0,
    activeDateKey: day0,
    activeCategoryId: lunchId,
    categories,
    recipes,
    plans: planEntries,
  }
}

export function loadMealState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.categories) || !Array.isArray(state.recipes) || !Array.isArray(state.plans)) return seedState()
    state.categories = state.categories.map((c) => ({
      id: String(c.id || uid('cat')),
      name: String(c.name || '').trim(),
      glyph: String(c.glyph || (String(c.name || '').slice(0, 1) || '类')).slice(0, 1),
      color: String(c.color || '#3d6afb'),
      enabled: typeof c.enabled === 'boolean' ? c.enabled : true,
      createdAtTs: Number(c.createdAtTs || 0) || Date.now(),
    }))
    state.recipes = state.recipes.map((r) => ({
      id: String(r.id || uid('rc')),
      title: String(r.title || '').trim(),
      categoryId: String(r.categoryId || ''),
      photoPath: String(r.photoPath || ''),
      note: String(r.note || ''),
      createdAtTs: Number(r.createdAtTs || 0) || Date.now(),
    }))
    state.plans = state.plans.map((p) => ({
      id: String(p.id || uid('pl')),
      date: String(p.date || ''),
      categoryId: String(p.categoryId || ''),
      recipeId: String(p.recipeId || ''),
      note: String(p.note || ''),
      repeat: !!p.repeat,
      createdAtTs: Number(p.createdAtTs || 0) || Date.now(),
    }))
    if (!state.weekStartKey) state.weekStartKey = seedState().weekStartKey
    if (!state.activeDateKey) state.activeDateKey = state.weekStartKey
    if (!state.activeCategoryId) state.activeCategoryId = (state.categories[0] && state.categories[0].id) || seedState().categories[0].id
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveMealState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureMealState() {
  const state = loadMealState()
  saveMealState(state)
  return state
}

export function listCategories(state, { enabledOnly } = {}) {
  const list = (state.categories || []).slice().sort((a, b) => (a.createdAtTs || 0) - (b.createdAtTs || 0))
  return enabledOnly ? list.filter((c) => c.enabled !== false) : list
}

export function findCategory(state, id) {
  return (state.categories || []).find((c) => c.id === id) || null
}

export function updateCategory(state, id, patch) {
  const idx = (state.categories || []).findIndex((c) => c.id === id)
  if (idx < 0) return false
  const cur = state.categories[idx]
  const next = { ...cur, ...(patch || {}) }
  next.name = String(next.name || '').trim()
  next.glyph = String(next.glyph || (next.name ? next.name.slice(0, 1) : cur.glyph || '类')).slice(0, 1)
  next.color = String(next.color || cur.color || '#3d6afb')
  next.enabled = typeof next.enabled === 'boolean' ? next.enabled : cur.enabled !== false
  state.categories[idx] = next
  saveMealState(state)
  return true
}

export function setCategoryEnabled(state, id, enabled) {
  return updateCategory(state, id, { enabled: !!enabled })
}

export function listRecipes(state) {
  return (state.recipes || []).slice().sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
}

export function findRecipe(state, id) {
  return (state.recipes || []).find((r) => r.id === id) || null
}

export function addRecipe(state, payload) {
  const title = String(payload.title || '').trim()
  if (!title) return null
  const r = {
    id: uid('rc'),
    title,
    categoryId: String(payload.categoryId || ''),
    photoPath: String(payload.photoPath || ''),
    note: String(payload.note || ''),
    createdAtTs: Date.now(),
  }
  state.recipes = [r, ...(state.recipes || [])]
  saveMealState(state)
  return r
}

export function updateRecipe(state, id, patch) {
  const idx = (state.recipes || []).findIndex((r) => r.id === id)
  if (idx < 0) return false
  const cur = state.recipes[idx]
  const next = { ...cur, ...(patch || {}) }
  next.title = String(next.title || '').trim()
  next.categoryId = String(next.categoryId || cur.categoryId || '')
  next.photoPath = String(next.photoPath || '')
  next.note = String(next.note || '')
  state.recipes[idx] = next
  saveMealState(state)
  return true
}

export function deleteRecipe(state, id, scope) {
  state.recipes = (state.recipes || []).filter((r) => r.id !== id)
  if (scope === 'recipe_and_plans') {
    state.plans = (state.plans || []).filter((p) => p.recipeId !== id)
  }
  saveMealState(state)
}

export function listPlans(state) {
  return (state.plans || []).slice().sort((a, b) => (a.createdAtTs || 0) - (b.createdAtTs || 0))
}

export function findPlan(state, id) {
  return (state.plans || []).find((p) => p.id === id) || null
}

export function plansForDateCategory(state, date, categoryId) {
  return listPlans(state).filter((p) => p.date === date && p.categoryId === categoryId)
}

export function addPlans(state, { date, categoryId, recipeIds, note, repeat }) {
  const ids = Array.isArray(recipeIds) ? recipeIds : []
  const existing = new Set(plansForDateCategory(state, date, categoryId).map((p) => p.recipeId))
  const out = []
  for (const rid of ids) {
    if (!rid) continue
    if (existing.has(rid)) continue
    const p = { id: uid('pl'), date, categoryId, recipeId: rid, note: String(note || ''), repeat: !!repeat, createdAtTs: Date.now() }
    out.push(p)
  }
  if (!out.length) return []
  state.plans = [...(state.plans || []), ...out]
  saveMealState(state)
  return out
}

export function updatePlan(state, id, patch) {
  const idx = (state.plans || []).findIndex((p) => p.id === id)
  if (idx < 0) return false
  state.plans[idx] = { ...state.plans[idx], ...(patch || {}) }
  saveMealState(state)
  return true
}

export function deletePlan(state, id) {
  state.plans = (state.plans || []).filter((p) => p.id !== id)
  saveMealState(state)
}

export function setWeekStartKey(state, key) {
  state.weekStartKey = key
  saveMealState(state)
  return state
}

export function setActiveDateKey(state, key) {
  state.activeDateKey = key
  saveMealState(state)
  return state
}

export function setActiveCategoryId(state, id) {
  state.activeCategoryId = id
  saveMealState(state)
  return state
}

export function weekDaysForKey(weekStartKey) {
  const start = startOfWeek(parseKey(weekStartKey))
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i)
    out.push({ key: dateKey(d), weekday: weekdayText(d), date: d.getDate(), month: d.getMonth() + 1 })
  }
  return out
}

export function weekRangeText(weekStartKey) {
  const start = startOfWeek(parseKey(weekStartKey))
  const end = addDays(start, 6)
  const locale = typeof uni !== 'undefined' && typeof uni.getLocale === 'function' ? String(uni.getLocale() || 'zh-CN') : 'zh-CN'
  try {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
    if (typeof formatter.formatRange === 'function') return formatter.formatRange(start, end)
    return `${formatter.format(start)} - ${formatter.format(end)}`
  } catch (e) {
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
  }
}

function currentLocaleTag() {
  return typeof uni !== 'undefined' && typeof uni.getLocale === 'function' ? String(uni.getLocale() || 'zh-CN') : 'zh-CN'
}

export function cnDateText(key) {
  const d = parseKey(key)
  try {
    return new Intl.DateTimeFormat(currentLocaleTag(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(d)
  } catch (e) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

export function cnMonthDayText(key) {
  const d = parseKey(key)
  try {
    return new Intl.DateTimeFormat(currentLocaleTag(), {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(d)
  } catch (e) {
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }
}

export function clearRecipeSelectTmp() {
  uni.removeStorageSync(TMP_SELECT_KEY)
}

export function readRecipeSelectTmp() {
  try {
    const raw = uni.getStorageSync(TMP_SELECT_KEY)
    if (!raw) return { recipeIds: [], date: '', categoryId: '', note: '', repeat: false }
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    const ids = Array.isArray(obj.recipeIds) ? obj.recipeIds.map((x) => String(x)) : []
    return {
      recipeIds: ids,
      date: String(obj.date || ''),
      categoryId: String(obj.categoryId || ''),
      note: String(obj.note || ''),
      repeat: !!obj.repeat,
    }
  } catch (e) {
    return { recipeIds: [], date: '', categoryId: '', note: '', repeat: false }
  }
}

export function writeRecipeSelectTmp(payload) {
  const next = {
    recipeIds: Array.isArray(payload.recipeIds) ? payload.recipeIds.map((x) => String(x)) : [],
    date: String(payload.date || ''),
    categoryId: String(payload.categoryId || ''),
    note: String(payload.note || ''),
    repeat: !!payload.repeat,
  }
  uni.setStorageSync(TMP_SELECT_KEY, JSON.stringify(next))
  return next
}
