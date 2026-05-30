// src/api.js — all API helpers
const BASE = '';  // Vercel serves /api/* from same origin

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const get  = (path)       => req('GET',    path);
const post = (path, body) => req('POST',   path, body);
const put  = (path, body) => req('PUT',    path, body);
const del  = (path)       => req('DELETE', path);

export const api = {
  // Auth
  login: (email, pin) => post('/auth/login', { email, pin }),

  // Locations
  getLocations: ()     => get('/locations'),
  createLocation: (d)  => post('/locations', d),
  updateLocation: (id, d) => put(`/locations/${id}`, d),

  // Rooms
  getRooms: (locId)    => get('/rooms' + (locId ? `?location_id=${locId}` : '')),
  createRoom: (d)      => post('/rooms', d),
  updateRoom: (id, d)  => put(`/rooms/${id}`, d),
  deleteRoom: (id)     => del(`/rooms/${id}`),

  // Bookings
  getBookings: (locId) => get('/bookings' + (locId ? `?location_id=${locId}` : '')),
  createBooking: (d)   => post('/bookings', d),
  updateBooking: (id, d) => put(`/bookings/${id}`, d),
  recordPayment: (id, amount) => put(`/bookings/${id}`, { add_payment: amount }),

  // Expenses
  getExpenses: (locId) => get('/expenses' + (locId ? `?location_id=${locId}` : '')),
  createExpense: (d)   => post('/expenses', d),

  // Staff
  getStaff: ()         => get('/staff'),
  createStaff: (d)     => post('/staff', d),
  updateStaff: (id, d) => put(`/staff/${id}`, d),

  // Reports
  getReports: (locId)  => get('/reports/summary' + (locId ? `?location_id=${locId}` : '')),
};
