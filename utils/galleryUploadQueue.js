const STORAGE_KEY = 'gallery_upload_jobs_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

export function loadUploadJobs() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return toArray(parsed)
  } catch (e) {
    return []
  }
}

export function saveUploadJobs(jobs) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(toArray(jobs)))
}

export function createUploadJobs({ albumId, items } = {}) {
  const now = nowText()
  const aid = String(albumId || '')
  const jobs = toArray(items)
    .filter((it) => it && it.uri)
    .map((it) => ({
      id: uid('upload'),
      albumId: aid,
      uri: String(it.uri || ''),
      type: String(it.type || 'image'),
      thumbUri: String(it.thumbUri || ''),
      name: String(it.name || String(it.uri || '').split('/').pop() || 'media'),
      note: String(it.note || ''),
      clipStart: Number(it.clipStart || 0) || 0,
      clipEnd: Number(it.clipEnd || 0) || 0,
      createdAt: now,
      status: 'pending',
      progress: 0,
      errorCode: '',
      errorText: '',
    }))
  const merged = [...jobs, ...loadUploadJobs()]
  saveUploadJobs(merged)
  return jobs
}

export function patchUploadJob(jobId, patch) {
  const list = loadUploadJobs()
  const next = list.map((it) => (it && it.id === jobId ? { ...it, ...(patch || {}) } : it))
  saveUploadJobs(next)
  return next
}

export function removeUploadJob(jobId) {
  const next = loadUploadJobs().filter((it) => it && it.id !== jobId)
  saveUploadJobs(next)
  return next
}

export function clearCompletedUploadJobs() {
  const next = loadUploadJobs().filter((it) => it && it.status !== 'success')
  saveUploadJobs(next)
  return next
}
