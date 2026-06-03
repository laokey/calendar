import { del, get, post, put } from '../request'

export function listEvents(params) {
  return get('/calendar/events', params)
}

export function getEvent(id) {
  return get(`/calendar/events/${encodeURIComponent(String(id || ''))}`)
}

export function createEvent(payload) {
  return post('/calendar/events', payload)
}

export function updateEvent(id, payload) {
  return put(`/calendar/events/${encodeURIComponent(String(id || ''))}`, payload)
}

export function deleteEvent(id) {
  return del(`/calendar/events/${encodeURIComponent(String(id || ''))}`)
}
