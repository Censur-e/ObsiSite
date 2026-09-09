// Serveur uniquement - accès Supabase via API REST (PostgREST) avec la clé secrète.
export async function sb(path, { method = 'GET', body, prefer, query } = {}) {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SECRET = process.env.SUPABASE_SECRET_KEY
  if (!SUPA_URL || !SECRET) {
    const err = new Error('Supabase env missing')
    err.status = 500
    throw err
  }
  let url = `${SUPA_URL}/rest/v1/${path}`
  if (query) url += (url.includes('?') ? '&' : '?') + query
  const headers = {
    apikey: SECRET,
    Authorization: `Bearer ${SECRET}`,
    'Content-Type': 'application/json',
  }
  if (prefer) headers['Prefer'] = prefer
  else if (method !== 'GET') headers['Prefer'] = 'return=representation'

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `Supabase ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function getProfileByDiscordId(discordId) {
  const rows = await sb(`profiles?discord_id=eq.${encodeURIComponent(discordId)}&limit=1`)
  return rows && rows[0] ? rows[0] : null
}

export async function getProfileById(id) {
  const rows = await sb(`profiles?id=eq.${encodeURIComponent(id)}&limit=1`)
  return rows && rows[0] ? rows[0] : null
}

export async function getProfileByApiKey(apiKey) {
  const rows = await sb(`profiles?api_key=eq.${encodeURIComponent(apiKey)}&limit=1`)
  return rows && rows[0] ? rows[0] : null
}

export async function insertProfile(profile) {
  const rows = await sb('profiles', { method: 'POST', body: profile })
  return rows && rows[0] ? rows[0] : null
}

export async function updateProfile(id, patch) {
  patch.updated_at = new Date().toISOString()
  const rows = await sb(`profiles?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })
  return rows && rows[0] ? rows[0] : null
}

export async function listProfiles() {
  return await sb('profiles?select=*&order=created_at.asc')
}

export async function listParameters() {
  return await sb('parameters?select=*&order=sort_order.asc')
}

export async function insertParameter(p) {
  const rows = await sb('parameters', { method: 'POST', body: p })
  return rows && rows[0] ? rows[0] : null
}

export async function updateParameter(id, patch) {
  const rows = await sb(`parameters?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })
  return rows && rows[0] ? rows[0] : null
}

export async function deleteParameter(id) {
  return await sb(`parameters?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function insertDetection(row) {
  const rows = await sb('detections', { method: 'POST', body: row })
  return rows && rows[0] ? rows[0] : null
}

export async function listDetections(profileId, { type, player, limit = 100 } = {}) {
  let q = `detections?profile_id=eq.${encodeURIComponent(profileId)}&order=created_at.desc&limit=${limit}`
  if (type) q += `&detection_type=eq.${encodeURIComponent(type)}`
  if (player) q += `&player_name=ilike.*${encodeURIComponent(player)}*`
  return await sb(q)
}
