// src/api.js
const BASE = ''

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}/api${path}`, opts)

  // Read the raw text first so we can give a useful error if it's not JSON
  const text = await res.text()

  if (!text || text.trim() === '') {
    if (!res.ok) throw new Error(`Request failed (${res.status}) — empty response`)
    return {}
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    // Not JSON — probably an HTML error page from Vercel
    console.error('Non-JSON response:', text.slice(0, 200))
    throw new Error(`Server returned non-JSON response (${res.status}). Check Vercel function logs.`)
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
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
