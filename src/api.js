// src/api.js
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  let res;
  try { res = await fetch(`/api/spa?${path}`, opts); }
  catch(e) { throw new Error(`Network error: ${e.message}`); }
  const text = await res.text().catch(()=>"");
  if (!text?.trim()) { if (!res.ok) throw new Error(`Request failed (${res.status})`); return {}; }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status}): ${text.slice(0,100)}`); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
const g  = path       => req('GET',    path);
const p  = (path, b)  => req('POST',   path, b);
const pt = (path, b)  => req('PUT',    path, b);
const d  = path       => req('DELETE', path);

export const api = {
  // Auth
  staffLogin:    b      => p('resource=staff&action=login', b),
  custRegister:  b      => p('resource=customers&action=register', b),
  custLogin:     b      => p('resource=customers&action=login', b),
  custAppts:     id     => g(`resource=customers&id=${id}`),

  // Therapists
  getTherapists:    ()      => g('resource=therapists'),
  createTherapist:  b       => p('resource=therapists', b),
  updateTherapist:  (id,b)  => pt(`resource=therapists&id=${id}`, b),
  deleteTherapist:  id      => d(`resource=therapists&id=${id}`),

  // Rooms
  getRooms:    ()      => g('resource=rooms'),
  createRoom:  b       => p('resource=rooms', b),
  updateRoom:  (id,b)  => pt(`resource=rooms&id=${id}`, b),
  deleteRoom:  id      => d(`resource=rooms&id=${id}`),

  // Services + Pricing
  getServices:   ()             => g('resource=services'),
  createService: b              => p('resource=services', b),
  updateService: (id,b)         => pt(`resource=services&id=${id}`, b),
  upsertPrice:   b              => p('resource=pricing', b),
  deletePrice:   id             => d(`resource=pricing&id=${id}`),

  // Offers
  getOffers:    ()      => g('resource=offers'),
  createOffer:  b       => p('resource=offers', b),
  updateOffer:  (id,b)  => pt(`resource=offers&id=${id}`, b),
  deleteOffer:  id      => d(`resource=offers&id=${id}`),

  // Appointments
  getAppointments: (params='') => g(`resource=appointments${params?'&'+params:''}`),
  createAppt:      b           => p('resource=appointments', b),
  updateAppt:      (id,b)      => pt(`resource=appointments&id=${id}`, b),
  deleteAppt:      id          => d(`resource=appointments&id=${id}`),

  // Reception log
  getReception:    (date='') => g(`resource=reception${date?'&date='+date:''}`),
  createReception: b         => p('resource=reception', b),
  deleteReception:  id      => d(`resource=reception&id=${id}`),
  updateReception: (id,b)    => pt(`resource=reception&id=${id}`, b),

  // Staff
  getStaff:      ()      => g('resource=staff'),
  createStaff:   b       => p('resource=staff', b),
  updateStaff:   (id,b)  => pt(`resource=staff&id=${id}`, b),
  deleteStaff:   id      => d(`resource=staff&id=${id}`),

  // Expenses
  getExpenses:    () => g('resource=expenses'),
  createExpense:  b       => p('resource=expenses', b),
  updateExpense:  (id,b)  => pt(`resource=expenses&id=${id}`, b),
  deleteExpense:  id      => d(`resource=expenses&id=${id}`),

  // Payment methods
  getPayMethods:    ()      => g('resource=payment_methods'),
  createPayMethod:  name    => p('resource=payment_methods', { name }),
  deletePayMethod:  id      => d(`resource=payment_methods&id=${id}`),

  // Reports
  getReports:  (df, dt) => g(`resource=reports${df?'&date_from='+df:''}${dt?'&date_to='+dt:''}`),

  // Therapist self-service (same endpoints, just for clarity)
  therapistLogin:      b      => p('resource=staff&action=login', b),
  therapistUpdate:     (id,b) => pt(`resource=therapists&id=${id}`, b),

  // Commission
  getCommission:  (df,dt) => g(`resource=commission${df?'&date_from='+df:''}${dt?'&date_to='+dt:''}`),
  // Fines
  getFines:      (rid)  => g(`resource=fines${rid?'&recipient_id='+rid:''}`),
  createFine:    b      => p('resource=fines', b),
  deleteFine:    id     => d(`resource=fines&id=${id}`),
  // Page views
  trackView:    page    => p('resource=pageviews', { page }),
  getViews:     (days)  => g(`resource=pageviews${days?'&days='+days:''}`),
  // Social settings
  getSocialSettings:  ()  => g('resource=social_settings'),
  saveSocialSettings: b   => p('resource=social_settings', b),
  // Videos
  getVideos:    ()     => g('resource=videos'),
  createVideo:  b      => p('resource=videos', b),
  deleteVideo:  id     => d(`resource=videos&id=${id}`),
  // Packages
  getPackages:    ()      => g('resource=packages'),
  createPackage:  b       => p('resource=packages', b),
  updatePackage:  (id,b)  => pt(`resource=packages&id=${id}`, b),
  deletePackage:  id      => d(`resource=packages&id=${id}`),
  // Payouts
  getPayouts:     (rid)  => g(`resource=payouts${rid?'&recipient_id='+rid:''}`),
  createPayout:   b      => p('resource=payouts', b),
  deletePayout:   id     => d(`resource=payouts&id=${id}`),
};
