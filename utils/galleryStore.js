const STORAGE_KEY = 'gallery_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function nowText() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function defaultState() {
  const devices = [
    { id: 'yyo', name: 'YYO的日历' },
    { id: 'dfs', name: 'DFSFDGF的日历' },
  ]

  return {
    version: 1,
    activeDeviceId: devices[0].id,
    devices,
    albumsByDevice: {
      yyo: [],
      dfs: [],
    },
    photosByAlbum: {},
    transfers: [],
  }
}

export function loadGalleryState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return defaultState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return defaultState()
    if (!state.devices || !state.albumsByDevice || !state.photosByAlbum || !state.transfers) return defaultState()
    return state
  } catch (e) {
    return defaultState()
  }
}

export function saveGalleryState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureGalleryState() {
  const state = loadGalleryState()
  saveGalleryState(state)
  return state
}

export function getActiveDevice(state) {
  const id = state.activeDeviceId
  const found = state.devices.find((d) => d.id === id)
  return found || state.devices[0]
}

export function setActiveDeviceId(state, deviceId) {
  state.activeDeviceId = deviceId
  saveGalleryState(state)
  return state
}

export function listAlbums(state, deviceId) {
  const list = state.albumsByDevice[deviceId] || []
  return list.slice().sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0))
}

export function addAlbum(state, deviceId, name) {
  const albumId = uid('alb')
  const album = {
    id: albumId,
    deviceId,
    name: String(name || '').trim() || '未命名相册',
    createdAt: nowText(),
    createdAtTs: Date.now(),
  }
  if (!state.albumsByDevice[deviceId]) state.albumsByDevice[deviceId] = []
  state.albumsByDevice[deviceId].unshift(album)
  state.photosByAlbum[albumId] = []
  saveGalleryState(state)
  return album
}

export function renameAlbum(state, albumId, name) {
  const next = String(name || '').trim()
  if (!next) return false
  for (const deviceId of Object.keys(state.albumsByDevice || {})) {
    const list = state.albumsByDevice[deviceId] || []
    const found = list.find((a) => a.id === albumId)
    if (found) {
      found.name = next
      saveGalleryState(state)
      return true
    }
  }
  return false
}

export function deleteAlbum(state, albumId) {
  for (const deviceId of Object.keys(state.albumsByDevice || {})) {
    const list = state.albumsByDevice[deviceId] || []
    const idx = list.findIndex((a) => a.id === albumId)
    if (idx >= 0) {
      list.splice(idx, 1)
      break
    }
  }
  delete state.photosByAlbum[albumId]
  state.transfers = (state.transfers || []).filter((t) => t.albumId !== albumId)
  saveGalleryState(state)
}

export function listPhotos(state, albumId) {
  const list = state.photosByAlbum[albumId] || []
  return list.slice().sort((a, b) => (b.createdAtTs || 0) - (a.createdAtTs || 0))
}

export function addTransferTasks(state, { deviceId, albumId, items }) {
  const now = Date.now()
  const tasks = (items || []).map((it) => {
    const id = uid('tr')
    const uri = String(it.uri || '')
    const name = it.name ? String(it.name) : uri.split('/').pop() || 'media'
    const type = it.type ? String(it.type) : 'image'
    const note = it.note ? String(it.note) : ''
    return {
      id,
      deviceId,
      albumId,
      uri,
      name,
      type,
      note,
      createdAt: nowText(),
      createdAtTs: now,
      status: 'uploading',
      progress: 0,
      errorCode: '',
      errorText: '',
    }
  })
  state.transfers = [...tasks, ...(state.transfers || [])]
  saveGalleryState(state)
  return tasks
}

export function tickTransfers(state) {
  const transfers = state.transfers || []
  const done = []

  for (const t of transfers) {
    if (t.status !== 'uploading') continue

    const r = Math.random()
    if (t.progress < 50 && r < 0.03) {
      t.status = 'failed'
      t.errorCode = 'too_large'
      t.errorText = '照片尺寸过大'
      continue
    }
    if (t.progress < 70 && r < 0.04) {
      t.status = 'failed'
      t.errorCode = 'network'
      t.errorText = '网络问题，请重新上传'
      continue
    }
    if (t.progress < 80 && r < 0.02) {
      t.status = 'failed'
      t.errorCode = 'illegal'
      t.errorText = '照片违规'
      continue
    }

    t.progress = Math.min(100, (t.progress || 0) + 12 + Math.floor(Math.random() * 10))
    if (t.progress >= 100) done.push(t)
  }

  if (done.length) {
    for (const t of done) {
      const photo = {
        id: uid('ph'),
        deviceId: t.deviceId,
        albumId: t.albumId,
        uri: t.uri,
        name: t.name,
        type: t.type,
        title: t.note || '',
        liked: false,
        createdAt: t.createdAt,
        createdAtTs: Date.now(),
        comments: [],
      }
      if (!state.photosByAlbum[t.albumId]) state.photosByAlbum[t.albumId] = []
      state.photosByAlbum[t.albumId].unshift(photo)
    }
    state.transfers = (state.transfers || []).filter((t) => t.status !== 'uploading' || t.progress < 100)
  }

  saveGalleryState(state)
  return state
}

export function removeTransfer(state, transferId) {
  state.transfers = (state.transfers || []).filter((t) => t.id !== transferId)
  saveGalleryState(state)
}

export function retryTransfer(state, transferId) {
  const t = (state.transfers || []).find((x) => x.id === transferId)
  if (!t) return false
  t.status = 'uploading'
  t.progress = 0
  t.errorCode = ''
  t.errorText = ''
  saveGalleryState(state)
  return true
}

export function deletePhotos(state, albumId, photoIds) {
  const set = new Set(photoIds || [])
  const list = state.photosByAlbum[albumId] || []
  state.photosByAlbum[albumId] = list.filter((p) => !set.has(p.id))
  saveGalleryState(state)
}

export function copyPhotosToAlbum(state, fromAlbumId, toAlbumId, photoIds) {
  const set = new Set(photoIds || [])
  const from = state.photosByAlbum[fromAlbumId] || []
  const to = state.photosByAlbum[toAlbumId] || []
  const copied = []
  for (const p of from) {
    if (!set.has(p.id)) continue
    copied.push({
      ...p,
      id: uid('ph'),
      albumId: toAlbumId,
      createdAt: nowText(),
      createdAtTs: Date.now(),
    })
  }
  state.photosByAlbum[toAlbumId] = [...copied, ...to]
  saveGalleryState(state)
}

export function movePhotosToAlbum(state, fromAlbumId, toAlbumId, photoIds) {
  copyPhotosToAlbum(state, fromAlbumId, toAlbumId, photoIds)
  deletePhotos(state, fromAlbumId, photoIds)
}

export function updatePhoto(state, albumId, photoId, patch) {
  const list = state.photosByAlbum[albumId] || []
  const p = list.find((x) => x.id === photoId)
  if (!p) return false
  Object.assign(p, patch || {})
  saveGalleryState(state)
  return true
}

export function addPhotoComment(state, albumId, photoId, { user, text }) {
  const list = state.photosByAlbum[albumId] || []
  const p = list.find((x) => x.id === photoId)
  if (!p) return false
  const content = String(text || '').trim()
  if (!content) return false
  if (!Array.isArray(p.comments)) p.comments = []
  p.comments.unshift({
    id: uid('cmt'),
    user: String(user || 'REERT'),
    text: content,
    createdAt: nowText(),
    createdAtTs: Date.now(),
  })
  saveGalleryState(state)
  return true
}

