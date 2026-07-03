import { getApiBaseUrl } from '../apiConfig'
import { clearToken, getToken, getUserId } from '../authToken'
import { HttpError, request } from '../request'
import { getCalendarDeviceList } from './device'

function buildQuery(params) {
  const obj = params && typeof params === 'object' ? params : {}
  const parts = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function pickMessage(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') {
    if (payload.message) return String(payload.message)
    if (payload.msg) return String(payload.msg)
    if (payload.error) return String(payload.error)
  }
  return ''
}

let redirectingToLogin = false

function goLoginPage() {
  if (redirectingToLogin) return
  redirectingToLogin = true
  try {
    clearToken()
    uni.removeStorageSync('auth_logged_in')
  } catch (e) {}
  setTimeout(() => {
    try {
      uni.reLaunch({ url: '/pages/login/index' })
    } finally {
      setTimeout(() => {
        redirectingToLogin = false
      }, 300)
    }
  }, 0)
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeMediaUrl(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw) || /^file:/i.test(raw)) return raw
  const normalized = raw.replace(/\\/g, '/').replace(/^\.?\/*/, '')
  if (!normalized) return ''
  const baseURL = String(getApiBaseUrl() || '').replace(/\/+$/, '')
  return `${baseURL}/${normalized}`
}

function parseUploadResponse(res, url) {
  const statusCode = res && Number.isFinite(res.statusCode) ? res.statusCode : 0
  const bodyRaw = res && res.data !== undefined ? res.data : undefined
  const body = typeof bodyRaw === 'string' ? safeJsonParse(bodyRaw) || bodyRaw : bodyRaw
  if (statusCode < 200 || statusCode >= 300) {
    throw new HttpError(pickMessage(body) || `HTTP ${statusCode || 'Error'}`, {
      statusCode,
      data: body,
      url,
      method: 'POST',
    })
  }
  if (isObject(body) && Object.prototype.hasOwnProperty.call(body, 'code')) {
    const code = body.code
    const ok = code === 0 || code === 200 || code === '0' || code === '200'
    if (!ok) {
      const msg = pickMessage(body) || '上传失败'
      if ((code === 201 || code === '201') && /用户不存在/.test(String(msg || ''))) goLoginPage()
      throw new HttpError(msg, { statusCode, code, data: body, url, method: 'POST' })
    }
  }
  if (isObject(body) && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

async function resolveDeviceEmail(passed) {
  const direct = String(passed || '').trim()
  if (direct) return direct
  try {
    const raw = uni.getStorageSync('calendar_detail_ctx_v1')
    const obj = typeof raw === 'string' ? safeJsonParse(raw) : raw
    const v = obj && obj.email ? String(obj.email).trim() : ''
    if (v) return v
  } catch (e) {}
  try {
    const v = String(uni.getStorageSync('active_device_email_v1') || '').trim()
    if (v) return v
  } catch (e) {}

  try {
    const list = await getCalendarDeviceList()
    const first = list && list[0] && list[0].deviceEmail ? String(list[0].deviceEmail).trim() : ''
    if (first) {
      try {
        uni.setStorageSync('active_device_email_v1', first)
      } catch (e) {}
      return first
    }
  } catch (e) {}
  return ''
}

function normalizeMealItem(it) {
  const x = it && typeof it === 'object' ? it : {}
  const rawMealId = x.mealId !== undefined ? x.mealId : x.mealid !== undefined ? x.mealid : x.id
  const rawRecipeId = x.recipeId !== undefined ? x.recipeId : x.recipeid !== undefined ? x.recipeid : x.recipe_id
  return {
    mealId: rawMealId === undefined || rawMealId === null ? '' : String(rawMealId),
    recipeId: rawRecipeId === undefined || rawRecipeId === null ? '' : String(rawRecipeId),
    recipeName: x.recipeName !== undefined ? String(x.recipeName) : String(x.title || x.name || ''),
    imageUrl: x.imageUrl !== undefined && x.imageUrl !== null ? String(x.imageUrl) : String(x.photoPath || x.image || ''),
    mealType:
      x.mealType !== undefined
        ? Number(x.mealType)
        : x.recipeType !== undefined
          ? Number(x.recipeType)
          : x.type !== undefined
            ? Number(x.type)
            : undefined,
  }
}

function normalizeDay(it) {
  const x = it && typeof it === 'object' ? it : {}
  const mealDate = x.mealDate !== undefined ? String(x.mealDate) : x.mealdate !== undefined ? String(x.mealdate) : String(x.date || '')
  let meals = []
  if (Array.isArray(x.meals)) {
    meals = x.meals.map(normalizeMealItem)
  } else if (x.meals && typeof x.meals === 'object') {
    const groups = [
      { key: 'breakfast', mealType: 0 },
      { key: 'lunch', mealType: 1 },
      { key: 'dinner', mealType: 2 },
      { key: 'snack', mealType: 3 },
    ]
    for (const g of groups) {
      const list = Array.isArray(x.meals[g.key]) ? x.meals[g.key] : []
      for (let i = 0; i < list.length; i += 1) {
        const item = normalizeMealItem(list[i])
        item.mealType = g.mealType
        item.uid = `${mealDate || 'day'}_${g.mealType}_${i}`
        meals.push(item)
      }
    }
  }
  for (let i = 0; i < meals.length; i += 1) {
    const m = meals[i]
    if (!m.uid) m.uid = `${mealDate || 'day'}_${m.mealType !== undefined ? String(m.mealType) : 'x'}_${i}`
  }
  return {
    mealDate,
    dayLabel: x.dayLabel !== undefined ? String(x.dayLabel) : '',
    dayNum: x.dayNum !== undefined ? Number(x.dayNum) : undefined,
    meals,
  }
}

function normalizeRecipe(it) {
  const x = it && typeof it === 'object' ? it : {}
  return {
    recipeId: x.recipeId !== undefined ? String(x.recipeId) : String(x.id || ''),
    recipeName: x.recipeName !== undefined ? String(x.recipeName) : String(x.title || x.name || ''),
    recipeType:
      x.recipeType !== undefined
        ? Number(x.recipeType)
        : x.type !== undefined
          ? Number(x.type)
          : undefined,
    description: x.description !== undefined ? String(x.description) : String(x.note || ''),
    imageUrl: x.imageUrl !== undefined ? String(x.imageUrl) : String(x.photoPath || ''),
  }
}

async function postForm(path, query) {
  const q = { ...(query || {}) }
  if (q.userId === undefined) {
    const userId = getUserId()
    if (userId !== '' && userId !== undefined && userId !== null) {
      q.userId = userId
    } else {
      try {
        const email = uni.getStorageSync('auth_email')
        if (email !== undefined && email !== null && String(email).trim()) q.userId = String(email).trim()
      } catch (e) {}
    }
  }
  return request({
    url: `${path}${buildQuery(q)}`,
    method: 'POST',
    withAuth: false,
    showErrorToast: false,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

async function getForm(path, query) {
  const q = { ...(query || {}) }
  if (q.userId === undefined) {
    const userId = getUserId()
    if (userId !== '' && userId !== undefined && userId !== null) {
      q.userId = userId
    } else {
      try {
        const email = uni.getStorageSync('auth_email')
        if (email !== undefined && email !== null && String(email).trim()) q.userId = String(email).trim()
      } catch (e) {}
    }
  }
  return request({
    url: `${path}${buildQuery(q)}`,
    method: 'GET',
    withAuth: false,
    showErrorToast: false,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function getWeekMealInfo({ deviceEmail, dates } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const ds = Array.isArray(dates) ? dates.map((x) => String(x || '').trim()).filter(Boolean) : []
  const d0 = ds[0] || ''
  const d1 = ds[1] || ''
  const d2 = ds[2] || ''
  const d3 = ds[3] || ''
  const d4 = ds[4] || ''
  const d5 = ds[5] || ''
  const d6 = ds[6] || ''
  const res = await postForm('/calendar/app/getWeekMealInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    sunDate: d0,
    sundate: d0,
    monDate: d1,
    mondate: d1,
    tueDate: d2,
    tuedate: d2,
    wedDate: d3,
    weddate: d3,
    thuDate: d4,
    thudate: d4,
    friDate: d5,
    fridate: d5,
    satDate: d6,
    satdate: d6,
  })
  const list =
    Array.isArray(res) ? res :
    res && typeof res === 'object' && Array.isArray(res.data) ? res.data :
    res && typeof res === 'object' && Array.isArray(res.list) ? res.list :
    []
  return list.map(normalizeDay).filter((x) => x && x.mealDate)
}

export async function addMealInfo({ deviceEmail, mealType, mealDate, recipeId } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  return postForm('/calendar/app/addMealInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    mealType,
    mealtype: mealType,
    mealDate,
    mealdate: mealDate,
    recipeId,
    recipeid: recipeId,
    recipedId: recipeId,
  })
}

export async function deleteMealInfo({ mealId } = {}) {
  const token = getToken()
  const id = String(mealId || '').trim()
  return postForm('/calendar/app/deleteMealInfo', { token, mealId: id, mealid: id })
}

export async function getRecipeList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getRecipeList', { token, deviceEmail: email, deviceemail: email })
  const list =
    Array.isArray(res) ? res :
    res && typeof res === 'object' && Array.isArray(res.data) ? res.data :
    res && typeof res === 'object' && Array.isArray(res.list) ? res.list :
    []
  return list.map(normalizeRecipe).filter((x) => x && x.recipeId)
}

export async function getRecipeTypeInfo({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  let res
  try {
    res = await postForm('/calendar/app/getRecipeTypeList', { token, deviceEmail: email, deviceemail: email })
  } catch (e) {
    if (e && e.statusCode === 405) {
      res = await getForm('/calendar/app/getRecipeTypeList', { token, deviceEmail: email, deviceemail: email })
    } else {
      throw e
    }
  }
  const list =
    Array.isArray(res) ? res :
    res && typeof res === 'object' && Array.isArray(res.data) ? res.data :
    res && typeof res === 'object' && Array.isArray(res.list) ? res.list :
    []
  return list
    .map((x) => {
      const it = x && typeof x === 'object' ? x : {}
      const typeIndexRaw =
        it.typeIndex !== undefined
          ? it.typeIndex
          : it.typeindex !== undefined
            ? it.typeindex
            : it.mealType !== undefined
              ? it.mealType
              : it.mealtype !== undefined
                ? it.mealtype
                : it.type !== undefined
                  ? it.type
                  : undefined
      const typeColorRaw =
        it.typeColor !== undefined ? it.typeColor : it.typecolor !== undefined ? it.typecolor : undefined
      return {
        typeIndex: typeIndexRaw === undefined || typeIndexRaw === null ? undefined : Number(typeIndexRaw),
        typeName: it.typeName !== undefined ? String(it.typeName) : it.typename !== undefined ? String(it.typename) : '',
        typeColor: typeColorRaw === undefined || typeColorRaw === null ? undefined : Number(typeColorRaw),
      }
    })
    .filter((x) => x && Number.isFinite(x.typeIndex))
}

export async function updateRecipeTypeInfo({ deviceEmail, typeIndex, typeName, typeColor } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  return postForm('/calendar/app/updateRecipeTypeInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    typeIndex,
    typeindex: typeIndex,
    typeName,
    typename: typeName,
    typeColor,
    typecolor: typeColor,
  })
}

export async function addRecipeInfo({ deviceEmail, recipeName, recipeType, description, imageUrl } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  return postForm('/calendar/app/addRecipeInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    recipeName,
    recipename: recipeName,
    recipeType,
    recipetype: recipeType,
    description,
    imageUrl,
    imageurl: imageUrl,
  })
}

export async function deleteRecipeInfo({ recipeId } = {}) {
  const token = getToken()
  const id = String(recipeId || '').trim()
  return postForm('/calendar/app/deleteRecipeInfo', { token, recipeId: id, recipeid: id })
}

export async function uploadRecipeFile({ recipeId, filePath, onProgress } = {}) {
  const token = getToken()
  const rid = normalizeText(recipeId)
  const baseURL = String(getApiBaseUrl() || '').replace(/\/+$/, '')
  const url = `${baseURL}/calendar/app/uploadRecipeFile`

  return new Promise((resolve, reject) => {
    const formData = {
      token,
      recipeId: rid,
      recipeid: rid,
    }
    const task = uni.uploadFile({
      url,
      filePath: normalizeText(filePath),
      name: 'file',
      formData,
      success: (res) => {
        try {
          const out = parseUploadResponse(res, url)
          if (typeof out === 'string') resolve(normalizeMediaUrl(out))
          else resolve(out)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(
          new HttpError(pickMessage(err) || '上传失败', {
            statusCode: 0,
            data: err,
            url,
            method: 'POST',
          }),
        )
      },
    })
    if (task && typeof task.onProgressUpdate === 'function' && typeof onProgress === 'function') {
      task.onProgressUpdate((res) => {
        try {
          onProgress(res)
        } catch (e) {}
      })
    }
  })
}
