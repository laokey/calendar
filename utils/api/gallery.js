import { getApiBaseUrl } from '../apiConfig'
import { getToken } from '../authToken'
import { HttpError, post } from '../request'
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

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function extractList(payload, keys = []) {
  if (Array.isArray(payload)) return payload
  const obj = isObject(payload) ? payload : {}
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key]
  }
  return []
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function normalizeMediaUrl(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw)) return raw
  const normalized = raw.replace(/\\/g, '/').replace(/^\.?\/*/, '')
  if (!normalized) return ''
  const baseURL = String(getApiBaseUrl() || '').replace(/\/+$/, '')
  return `${baseURL}/${normalized}`
}

function normalizeTimeText(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  return raw.replace('T', ' ').replace(/\//g, '.')
}

function inferMediaType(item, uri) {
  const x = isObject(item) ? item : {}
  const direct = normalizeText(
    x.type !== undefined
      ? x.type
      : x.fileType !== undefined
        ? x.fileType
        : x.mediaType !== undefined
          ? x.mediaType
          : x.photoType !== undefined
            ? x.photoType
            : '',
  ).toLowerCase()
  if (direct.includes('video') || direct === '2') return 'video'
  if (direct.includes('image') || direct === '1') return 'image'
  const source = String(uri || '').toLowerCase()
  if (/\.(mp4|mov|m4v|avi|webm|mkv)(\?|$)/.test(source)) return 'video'
  return 'image'
}

function normalizePhoto(item, fallbackAlbumId = '') {
  const x = isObject(item) ? item : {}
  const id = normalizeText(
    x.photoId !== undefined
      ? x.photoId
      : x.photoid !== undefined
        ? x.photoid
        : x.id !== undefined
          ? x.id
          : x.fileId !== undefined
            ? x.fileId
            : '',
  )
  const uri = normalizeMediaUrl(
    x.photoUrl !== undefined
      ? x.photoUrl
      : x.photourl !== undefined
        ? x.photourl
        : x.fileUrl !== undefined
          ? x.fileUrl
          : x.imageUrl !== undefined
            ? x.imageUrl
            : x.photoPath !== undefined
              ? x.photoPath
              : x.path !== undefined
                ? x.path
                : x.url !== undefined
                  ? x.url
                  : x.uri !== undefined
                    ? x.uri
                    : x.msg !== undefined
                      ? x.msg
                      : '',
  )
  const thumbUri = normalizeMediaUrl(
    x.thumbUrl !== undefined
      ? x.thumbUrl
      : x.thumburl !== undefined
        ? x.thumburl
        : x.thumbnailUrl !== undefined
          ? x.thumbnailUrl
          : x.coverUrl !== undefined
            ? x.coverUrl
            : x.cover !== undefined
              ? x.cover
              : x.thumbPath !== undefined
                ? x.thumbPath
                : x.thumbUri !== undefined
                  ? x.thumbUri
                  : x.poster !== undefined
                    ? x.poster
                    : '',
  )
  const createdAt = normalizeTimeText(
    x.leaveTime !== undefined
      ? x.leaveTime
      : x.createdAt !== undefined
        ? x.createdAt
        : x.createTime !== undefined
          ? x.createTime
          : x.uploadTime !== undefined
            ? x.uploadTime
            : x.uploadtime !== undefined
              ? x.uploadtime
              : x.time !== undefined
                ? x.time
                : x.photoTime !== undefined
                  ? x.photoTime
                  : x.phototime !== undefined
                    ? x.phototime
                    : x.create_time !== undefined
                      ? x.create_time
                      : x.leave_time !== undefined
                        ? x.leave_time
                        : '',
  )
  const name = normalizeText(
    x.photoName !== undefined
      ? x.photoName
      : x.photoname !== undefined
        ? x.photoname
        : x.name !== undefined
          ? x.name
          : '',
  )
  const type = inferMediaType(x, uri || thumbUri)
  return {
    id,
    albumId: normalizeText(x.albumId !== undefined ? x.albumId : x.albumid !== undefined ? x.albumid : fallbackAlbumId),
    uri,
    thumbUri,
    type,
    name,
    title: normalizeText(
      x.photoTitle !== undefined
        ? x.photoTitle
        : x.phototitle !== undefined
          ? x.phototitle
          : x.title !== undefined
            ? x.title
            : x.note !== undefined
              ? x.note
              : '',
    ),
    liked: false,
    createdAt,
    comments: [],
  }
}

function normalizeAlbum(item) {
  const x = isObject(item) ? item : {}
  const albumId = normalizeText(
    x.albumId !== undefined
      ? x.albumId
      : x.albumid !== undefined
        ? x.albumid
        : x.id !== undefined
          ? x.id
          : '',
  )
  const photos = extractList(x.photos, ['list', 'data'])
  const photoList = Array.isArray(x.photos)
    ? x.photos
    : Array.isArray(x.photoList)
      ? x.photoList
      : Array.isArray(x.photolist)
        ? x.photolist
        : photos
  const normalizedPhotos = photoList.map((it) => normalizePhoto(it, albumId)).filter((it) => it && it.id)
  const totalRaw =
    x.total !== undefined
      ? x.total
      : x.count !== undefined
        ? x.count
        : x.photoTotal !== undefined
          ? x.photoTotal
          : normalizedPhotos.length
  const total = Number(totalRaw)
  const isLikeRaw = x.isLike !== undefined ? x.isLike : x.islike !== undefined ? x.islike : x.like !== undefined ? x.like : 0
  const isLikeNum = Number(isLikeRaw)
  return {
    id: albumId,
    albumId,
    name: normalizeText(
      x.albumName !== undefined
        ? x.albumName
        : x.albumname !== undefined
          ? x.albumname
          : x.name !== undefined
            ? x.name
            : '',
    ),
    albumName: normalizeText(
      x.albumName !== undefined
        ? x.albumName
        : x.albumname !== undefined
          ? x.albumname
          : x.name !== undefined
            ? x.name
            : '',
    ),
    total: Number.isFinite(total) ? total : normalizedPhotos.length,
    isLike: Number.isFinite(isLikeNum) ? isLikeNum : 0,
    createdAt: normalizeTimeText(
      x.createdAt !== undefined
        ? x.createdAt
        : x.createTime !== undefined
          ? x.createTime
          : x.leaveTime !== undefined
            ? x.leaveTime
            : '',
    ),
    photos: normalizedPhotos,
  }
}

function normalizeComment(item) {
  const x = isObject(item) ? item : {}
  const id = normalizeText(
    x.commentId !== undefined
      ? x.commentId
      : x.commentid !== undefined
        ? x.commentid
        : x.id !== undefined
          ? x.id
          : '',
  )
  return {
    id,
    commentId: id,
    user: normalizeText(
      x.userName !== undefined
        ? x.userName
        : x.username !== undefined
          ? x.username
          : x.user !== undefined
            ? x.user
            : '',
    ),
    text: normalizeText(x.comment !== undefined ? x.comment : x.content !== undefined ? x.content : ''),
    createdAt: normalizeTimeText(
      x.leaveTime !== undefined
        ? x.leaveTime
        : x.createdAt !== undefined
          ? x.createdAt
          : x.createTime !== undefined
            ? x.createTime
            : '',
    ),
  }
}

async function resolveDeviceEmail(passed) {
  const direct = normalizeText(passed)
  if (direct) return direct
  try {
    const raw = uni.getStorageSync('calendar_detail_ctx_v1')
    const obj = typeof raw === 'string' ? safeJsonParse(raw) : raw
    const v = obj && obj.email ? String(obj.email).trim() : ''
    if (v) return v
  } catch (e) {}
  try {
    const v = normalizeText(uni.getStorageSync('active_device_email_v1'))
    if (v) return v
  } catch (e) {}
  try {
    const list = await getCalendarDeviceList()
    const first = list && list[0] && list[0].deviceEmail ? normalizeText(list[0].deviceEmail) : ''
    if (first) {
      try {
        uni.setStorageSync('active_device_email_v1', first)
      } catch (e) {}
      return first
    }
  } catch (e) {}
  return ''
}

async function postForm(path, query) {
  const header = { 'Content-Type': 'application/x-www-form-urlencoded' }
  return post(`${path}${buildQuery(query)}`, undefined, { withAuth: false, showErrorToast: false, header })
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
      throw new HttpError(pickMessage(body) || '上传失败', {
        statusCode,
        code,
        data: body,
        url,
        method: 'POST',
      })
    }
  }
  if (isObject(body) && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

export async function getAlbumList({ deviceEmail } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const res = await postForm('/calendar/app/getAlbumList', {
    token,
    deviceEmail: email,
    deviceemail: email,
  })
  const list = extractList(res, ['list', 'data', 'albumList', 'albums'])
  return list.map(normalizeAlbum).filter((it) => it && it.albumId)
}

export async function createAlbumInfo({ deviceEmail, albumName } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const name = normalizeText(albumName)
  return postForm('/calendar/app/createAlbumInfo', {
    token,
    deviceEmail: email,
    albumName: name,
  })
}

export async function updateAlbumInfo({ deviceEmail, albumId, albumName } = {}) {
  const token = getToken()
  const email = await resolveDeviceEmail(deviceEmail)
  const id = normalizeText(albumId)
  const name = normalizeText(albumName)
  return postForm('/calendar/app/updateAlbumInfo', {
    token,
    deviceEmail: email,
    deviceemail: email,
    albumId: id,
    albumid: id,
    albumName: name,
    albumname: name,
  })
}

export async function deleteAlbumInfo({ albumId } = {}) {
  const token = getToken()
  const id = normalizeText(albumId)
  return postForm('/calendar/app/deleteAlbumInfo', {
    token,
    albumId: id,
    albumid: id,
  })
}

export async function likeAlbum({ albumId } = {}) {
  const token = getToken()
  const id = normalizeText(albumId)
  return postForm('/calendar/app/likeAlbum', {
    token,
    albumId: id,
    albumid: id,
  })
}

export async function unlikeAlbum({ albumId } = {}) {
  const token = getToken()
  const id = normalizeText(albumId)
  try {
    return await postForm('/calendar/app/unlikeAlbum', {
      token,
      albumId: id,
      albumid: id,
    })
  } catch (e) {
    if (e && e.statusCode === 404) {
      return await postForm('/calendar/app/likeAlbum', {
        token,
        albumId: id,
        albumid: id,
      })
    }
    throw e
  }
}

export async function deleteAlbumPhoto({ photoId } = {}) {
  const token = getToken()
  const id = normalizeText(photoId)
  return postForm('/calendar/app/deleteAlbumPhoto', {
    token,
    photoId: id,
    photoid: id,
  })
}

export async function getAlbumCommentList({ albumId } = {}) {
  const token = getToken()
  const id = normalizeText(albumId)
  const res = await postForm('/calendar/app/getAlbumCommentList', {
    token,
    albumId: id,
    albumid: id,
  })
  const list = extractList(res, ['list', 'data', 'commentList', 'comments'])
  if (list.length) return list.map(normalizeComment).filter((it) => it && it.commentId)
  if (isObject(res) && (res.commentId !== undefined || res.commentid !== undefined)) {
    return [normalizeComment(res)].filter((it) => it && it.commentId)
  }
  return []
}

export async function addAlbumComment({ albumId, comment } = {}) {
  const token = getToken()
  const id = normalizeText(albumId)
  const text = normalizeText(comment)
  const res = await postForm('/calendar/app/addAlbumCommentInfo', {
    token,
    albumId: id,
    comment: text,
  })
  if (isObject(res) && (res.commentId !== undefined || res.commentid !== undefined)) return normalizeComment(res)
  return res
}

export async function deleteAlbumComment({ albumId, commentId } = {}) {
  const token = getToken()
  const aid = normalizeText(albumId)
  const cid = normalizeText(commentId)
  return postForm('/calendar/app/deleteAlbumComment', {
    token,
    albumId: aid,
    albumid: aid,
    commentId: cid,
    commentid: cid,
  })
}

export async function updateAlbumPhotoTitle({ photoId, photoTitle } = {}) {
  const token = getToken()
  const id = normalizeText(photoId)
  const title = normalizeText(photoTitle)
  return postForm('/calendar/app/updateAlbumPhotoTitle', {
    token,
    photoId: id,
    photoTitle: title,
  })
}

export async function uploadPhotoFile({ albumId, filePath, photoTitle, onProgress } = {}) {
  const token = getToken()
  const aid = normalizeText(albumId)
  const title = normalizeText(photoTitle)
  const baseURL = String(getApiBaseUrl() || '').replace(/\/+$/, '')
  const url = `${baseURL}/calendar/app/uploadPhotoFile`

  return new Promise((resolve, reject) => {
    const formData = {
      token,
      albumId: aid,
    }
    if (title) formData.photoTitle = title
    const task = uni.uploadFile({
      url,
      filePath: normalizeText(filePath),
      name: 'file',
      formData,
      success: (res) => {
        try {
          resolve(parseUploadResponse(res, url))
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
