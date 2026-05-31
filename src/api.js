// src/api.js
const BASE = ''

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}/api${path}`, opts)
  const text = await res.text()

  if (!text || text.trim() === '') {
    if (!res.ok) throw new Error(`Request failed (${res.status}) — empty response`)
    return {}
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    console.error('Non-JSON response:', text.slice(0, 200))
    throw new Error(`Server error (${res.status}). Check Vercel function logs.`)
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

const get  = path       => req('GET',    path)
const post = (path, b)  => req('POST',   path, b)
const put  = (path, b)  => req('PUT',    path, b)
const del  = path       => req('DELETE', path)

export const api = {
  login:          (email, pin) => post('/auth', { email, pin }),
  getLocations:   ()           => get('/locations'),
  createLocation: d            => post('/locations', d),
  updateLocation: (id, d)      => put(`/locations?id=${id}`, d),
  deleteLocation: id           => del(`/locations?id=${id}`),
  getRooms:       locId        => get('/rooms' + (locId ? `?location_id=${locId}` : '')),
  createRoom:     d            => post('/rooms', d),
  updateRoom:     (id, d)      => put(`/rooms?id=${id}`, d),
  deleteRoom:     id           => del(`/rooms?id=${id}`),
  getBookings:    locId        => get('/bookings' + (locId ? `?location_id=${locId}` : '')),
  createBooking:  d            => post('/bookings', d),
  updateBooking:  (id, d)      => put(`/bookings?id=${id}`, d),
  recordPayment:  (id, amount) => put(`/bookings?id=${id}`, { add_payment: amount }),
  extendBooking:  (id, d)      => put(`/bookings?id=${id}&action=extend`, d),
  deleteBooking:  id           => del(`/bookings?id=${id}`),
  getExpenses:    locId        => get('/expenses' + (locId ? `?location_id=${locId}` : '')),
  createExpense:  d            => post('/expenses', d),
  getStaff:       ()           => get('/staff'),
  createStaff:    d            => post('/staff', d),
  updateStaff:    (id, d)      => put(`/staff?id=${id}`, d),
  updateProfile:  d            => put('/staff?me=1', d),
  getReports:     locId        => get('/reports' + (locId ? `?location_id=${locId}` : '')),
}
