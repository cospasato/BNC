// src/api.js — all API helpers
const BASE = ''

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}/api${path}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const get  = path       => req('GET',    path)
const post = (path, b)  => req('POST',   path, b)
const put  = (path, b)  => req('PUT',    path, b)

export const api = {
  login:          (email, pin) => post('/auth/login', { email, pin }),
  getLocations:   ()           => get('/locations'),
  createLocation: d            => post('/locations', d),
  updateLocation: (id, d)      => put(`/locations/${id}`, d),
  getRooms:       locId        => get('/rooms' + (locId ? `?location_id=${locId}` : '')),
  createRoom:     d            => post('/rooms', d),
  updateRoom:     (id, d)      => put(`/rooms/${id}`, d),
  getBookings:    locId        => get('/bookings' + (locId ? `?location_id=${locId}` : '')),
  createBooking:  d            => post('/bookings', d),
  updateBooking:  (id, d)      => put(`/bookings/${id}`, d),
  recordPayment:  (id, amount) => put(`/bookings/${id}`, { add_payment: amount }),
  getExpenses:    locId        => get('/expenses' + (locId ? `?location_id=${locId}` : '')),
  createExpense:  d            => post('/expenses', d),
  getStaff:       ()           => get('/staff'),
  createStaff:    d            => post('/staff', d),
  updateStaff:    (id, d)      => put(`/staff/${id}`, d),
  getReports:     locId        => get('/reports/summary' + (locId ? `?location_id=${locId}` : '')),
}
