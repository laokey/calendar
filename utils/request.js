import { getApiBaseUrl } from './apiConfig'
import { clearToken, getToken } from './authToken'

export class HttpError extends Error {
  constructor(message, options) {
    super(message || 'Request Error')
    this.name = 'HttpError'
    this.statusCode = options && Number.isFinite(options.statusCode) ? options.statusCode : 0
    this.code = options && (options.code !== undefined ? options.code : undefined)
    this.data = options && (options.data !== undefined ? options.data : undefined)
    this.url = options && options.url ? String(options.url) : ''
    this.method = options && options.method ? String(options.method) : ''
  }
}

const config = {
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  withAuth: true,
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer ',
  showErrorToast: true,
  enableLog: false,
  onUnauthorized: () => {
    clearToken()
    try {
      uni.removeStorageSync('auth_logged_in')
    } catch (e) {}
  },
}
const requestInterceptors = []
const responseInterceptors = []
let redirectingToLogin = false

function goLoginPage() {
  if (redirectingToLogin) return
  redirectingToLogin = true
  try {
    clearToken()
    uni.removeStorageSync('auth_logged_in')
  } catch (e) {}
  try {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    const current = pages && pages.length ? pages[pages.length - 1] : null
    if (current && current.route === 'pages/login/index') {
      redirectingToLogin = false
      return
    }
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

export function setRequestConfig(patch) {
  if (!patch || typeof patch !== 'object') return getRequestConfig()
  Object.assign(config, patch)
  return getRequestConfig()
}

export function getRequestConfig() {
  return { ...config }
}

export function setHttpLogEnabled(enabled) {
  config.enableLog = !!enabled
  try {
    uni.setStorageSync('debug_http_log', config.enableLog ? '1' : '0')
  } catch (e) {}
  return config.enableLog
}

export function isHttpLogEnabled() {
  if (config.enableLog) return true
  try {
    const v = uni.getStorageSync('debug_http_log')
    if (v === '1' || v === 1 || v === true) return true
  } catch (e) {}
  return false
}

function safeLog(args) {
  try {
    // eslint-disable-next-line no-console
    console.log.apply(console, args)
  } catch (e) {}
}

function printHttpRequest(req, url, method, startAt) {
  if (!isHttpLogEnabled()) return
  const tag = `[http] ➡️ ${method} ${url}`
  safeLog([
    `%c${tag}`,
    'color:#3d6afb;font-weight:600;',
    {
      header: req && req.header,
      data: req && req.data,
      startAt: new Date(startAt).toISOString(),
    },
  ])
}

function printHttpResponse(url, method, statusCode, body, startAt, isError, extra) {
  if (!isHttpLogEnabled()) return
  const cost = startAt ? ` cost=${Date.now() - startAt}ms` : ''
  const color = isError ? '#ff5a5f' : statusCode >= 400 ? '#ffb020' : '#34c38f'
  const tag = isError
    ? `[http] ❌ ${method} ${url}${cost}`
    : `[http] ⬅️ ${method} ${url} -> ${statusCode}${cost}`
  safeLog([
    `%c${tag}`,
    `color:${color};font-weight:600;`,
    { statusCode, body, ...(extra || {}) },
  ])
}

export function addRequestInterceptor(fn) {
  if (typeof fn === 'function') requestInterceptors.push(fn)
  return () => {
    const i = requestInterceptors.indexOf(fn)
    if (i >= 0) requestInterceptors.splice(i, 1)
  }
}

export function addResponseInterceptor(fn) {
  if (typeof fn === 'function') responseInterceptors.push(fn)
  return () => {
    const i = responseInterceptors.indexOf(fn)
    if (i >= 0) responseInterceptors.splice(i, 1)
  }
}

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(String(url || ''))
}

function joinUrl(baseURL, url) {
  const b = String(baseURL || '').replace(/\/+$/, '')
  const u = String(url || '').replace(/^\/+/, '')
  if (!b) return `/${u}`
  if (!u) return b
  return `${b}/${u}`
}

function normalizeMethod(method) {
  const m = String(method || 'GET').toUpperCase()
  if (m === 'DELETE') return 'DELETE'
  if (m === 'PUT') return 'PUT'
  if (m === 'PATCH') return 'PATCH'
  if (m === 'POST') return 'POST'
  return 'GET'
}

function toRequestPromise(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    })
  })
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

function showToast(message) {
  const title = String(message || '').trim()
  if (!title) return
  try {
    uni.showToast({ title, icon: 'none' })
  } catch (e) {}
}

function parseBusinessResponse(body) {
  if (!body || typeof body !== 'object') return { ok: true, data: body }
  const hasCode = Object.prototype.hasOwnProperty.call(body, 'code')
  if (!hasCode) return { ok: true, data: body }
  const code = body.code
  const ok = code === 0 || code === 200 || code === '0' || code === '200'
  if (!ok) {
    const message = pickMessage(body) || '请求失败'
    return { ok: false, code, message, data: body }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'data')) {
    return { ok: true, data: body.data }
  }
  return { ok: true, data: body }
}

export async function request(options) {
  const method = normalizeMethod(options && options.method ? options.method : 'GET')
  const baseURL = options && options.baseURL !== undefined ? options.baseURL : config.baseURL
  const rawUrl = options && options.url ? String(options.url) : ''
  const url = isAbsoluteUrl(rawUrl) ? rawUrl : joinUrl(baseURL, rawUrl)
  const timeout = options && options.timeout !== undefined ? options.timeout : config.timeout
  const showErrorToast = options && options.showErrorToast !== undefined ? !!options.showErrorToast : !!config.showErrorToast

  const header = { ...(options && options.header ? options.header : {}) }
  const withAuth = options && options.withAuth !== undefined ? !!options.withAuth : !!config.withAuth
  if (withAuth) {
    const token = getToken()
    if (token && !header[config.tokenHeader]) {
      header[config.tokenHeader] = `${config.tokenPrefix}${token}`
    }
  }

  let req = {
    url,
    method,
    timeout,
    header,
    data: options && options.data !== undefined ? options.data : undefined,
    dataType: options && options.dataType ? options.dataType : 'json',
    responseType: options && options.responseType ? options.responseType : 'text',
  }

  for (const fn of requestInterceptors) {
    const next = await fn(req)
    if (next && typeof next === 'object') req = next
  }

  const startAt = Date.now()
  printHttpRequest(req, url, method, startAt)

  try {
    const res = await toRequestPromise(req)
    let out = res
    for (const fn of responseInterceptors) {
      const next = await fn(out, req)
      if (next !== undefined) out = next
    }

    const statusCode = out && Number.isFinite(out.statusCode) ? out.statusCode : 0
    const body = out ? out.data : undefined

    if (statusCode === 401) {
      try {
        if (typeof config.onUnauthorized === 'function') config.onUnauthorized()
      } catch (e) {}
      printHttpResponse(url, method, statusCode, body, startAt, false)
      goLoginPage()
    } else {
      printHttpResponse(url, method, statusCode, body, startAt, false)
    }

    if (statusCode < 200 || statusCode >= 300) {
      const message = pickMessage(body) || `HTTP ${statusCode || 'Error'}`
      const err = new HttpError(message, { statusCode, data: body, url, method })
      if (showErrorToast) showToast(err.message)
      throw err
    }

    const parsed = parseBusinessResponse(body)
    if (!parsed.ok) {
      if ((parsed.code === 201 || parsed.code === '201') && /用户不存在/.test(String(parsed.message || ''))) {
        goLoginPage()
      }
      const err = new HttpError(parsed.message || '请求失败', {
        statusCode,
        code: parsed.code,
        data: parsed.data,
        url,
        method,
      })
      if (showErrorToast) showToast(err.message)
      throw err
    }

    return parsed.data
  } catch (e) {
    if (e && e.name === 'HttpError') {
      printHttpResponse(url, method, e.statusCode, e.data, startAt, false)
      throw e
    }
    const message = pickMessage(e) || '网络异常，请稍后重试'
    const err = new HttpError(message, { statusCode: 0, data: e, url, method })
    printHttpResponse(url, method, 0, e, startAt, true)
    if (showErrorToast) showToast(err.message)
    throw err
  }
}

export function get(url, params, options) {
  return request({ ...(options || {}), url, method: 'GET', data: params })
}

export function post(url, data, options) {
  return request({ ...(options || {}), url, method: 'POST', data })
}

export function put(url, data, options) {
  return request({ ...(options || {}), url, method: 'PUT', data })
}

export function del(url, data, options) {
  return request({ ...(options || {}), url, method: 'DELETE', data })
}
