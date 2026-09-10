import { NextResponse } from 'next/server'
import {
  getProfileByDiscordId,
  getProfileById,
  getProfileByApiKey,
  insertProfile,
  updateProfile,
  listProfiles,
  listParameters,
  insertParameter,
  updateParameter,
  deleteParameter,
  insertDetection,
  listDetections,
  listBlacklist,
  getBlacklistEntry,
  insertBlacklist,
  deleteBlacklist,
} from '@/lib/supabaseRest'
import { signSession, verifySession, newApiKey } from '@/lib/session'

export const runtime = 'nodejs'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID
const COOKIE = 'obsidian_session'

function json(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  return res
}

export async function OPTIONS() {
  return json({}, 200)
}

function getSession(request) {
  const token = request.cookies.get(COOKIE)?.value
  return verifySession(token)
}

async function requireProfile(request) {
  const session = getSession(request)
  if (!session?.id) return null
  return await getProfileById(session.id)
}

function setDeep(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

function isLocked(param, profile) {
  return param.min_rank === 'Premium' && profile.rank !== 'Premium'
}

// Anti-SSRF : n'autorise que les vraies URLs de webhook Discord (https + hote Discord + chemin /api/webhooks/)
const DISCORD_WEBHOOK_HOSTS = ['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com']
function isValidDiscordWebhook(u) {
  if (typeof u !== 'string' || u.trim() === '') return false
  let parsed
  try { parsed = new URL(u.trim()) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  if (!DISCORD_WEBHOOK_HOSTS.includes(parsed.hostname.toLowerCase())) return false
  if (!parsed.pathname.startsWith('/api/webhooks/')) return false
  return true
}

function discordText(value, maxLength, fallback = '?') {
  const text = String(value ?? fallback).replace(/\u0000/g, '').trim() || fallback
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

async function sendDiscordWebhook(webhookUrl, payload) {
  try {
    const target = new URL(webhookUrl)
    target.searchParams.set('wait', 'true')
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (response.ok) return { ok: true }
    const responseText = await response.text().catch(() => '')
    let discordMessage = ''
    try { discordMessage = JSON.parse(responseText)?.message || '' } catch {}
    return { ok: false, status: response.status, error: discordMessage || `discord_http_${response.status}` }
  } catch (error) {
    console.error('Discord webhook error:', error?.message)
    return { ok: false, error: 'discord_network_error' }
  }
}

function buildRobloxConfig(params, profile) {
  const out = {}
  for (const p of params) {
    let val = profile.config ? profile.config[p.key] : undefined
    if (val === undefined || val === null) val = p.default_value
    if (isLocked(p, profile)) {
      val = p.type === 'boolean' ? false : p.default_value
    }
    setDeep(out, p.key, val)
  }
  out.webhook_url = profile.webhook_url || ''
  out.rank = profile.rank || 'Freemium'
  return out
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

function DEFAULT_EMBED() {
  return {
    title: '🚨 Alerte Anti-Cheat : {detection} ({sanction})',
    color: 15158332,
    footer: 'Obsidian Anticheat',
    show_player: true,
    show_server: true,
    show_reason: true,
  }
}

function buildEmbed(profile, d) {
  const cfg = { ...DEFAULT_EMBED(), ...(profile.embed_config || {}) }
  const title = String(cfg.title || '')
    .replaceAll('{detection}', d.detection_type || '?')
    .replaceAll('{sanction}', d.sanction || '?')
    .replaceAll('{player}', d.player_name || '?')
  const fields = []
  if (cfg.show_player !== false) {
    fields.push({
      name: 'Joueur',
      value: discordText(`**Nom :** \`${discordText(d.player_name, 120)}\`\n**UserId :** [${discordText(d.player_id, 40)}](https://www.roblox.com/users/${discordText(d.player_id, 40, '0')}/profile)`, 1024),
      inline: false,
    })
  }
  if (cfg.show_server !== false) {
    fields.push({
      name: 'Informations serveur',
      value: discordText(`**PlaceId :** \`${discordText(d.place_id, 40)}\`\n**JobId :** \`${discordText(d.job_id, 180, 'Studio')}\``, 1024),
      inline: false,
    })
  }
  if (cfg.show_reason !== false) {
    const reason = discordText(d.message, 950, 'Aucune raison').replaceAll('```', "'''")
    fields.push({ name: 'Raison', value: `\`\`\`${reason}\`\`\``, inline: false })
  }
  return {
    embeds: [{
      title: discordText(title, 256, 'Alerte Anti-Cheat'),
      color: Number(cfg.color) || 15158332,
      fields,
      footer: { text: discordText((cfg.footer || 'Obsidian Anticheat') + ' - ' + new Date().toLocaleDateString('fr-FR'), 2048) },
    }],
  }
}

// ---------------------------------------------------------------- GET
async function handleGET(request, route, url) {
  if (route === '/auth/discord/login') {
    const authorize =
      'https://discord.com/oauth2/authorize' +
      `?client_id=${DISCORD_CLIENT_ID}` +
      '&response_type=code' +
      `&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}` +
      '&scope=email+identify'
    return NextResponse.redirect(authorize)
  }

  if (route === '/auth/discord/callback') {
    const code = url.searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/?error=missing_code', BASE_URL))

    try {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
        cache: 'no-store',
      })
      if (!tokenRes.ok) return NextResponse.redirect(new URL('/?error=token', BASE_URL))
      const token = await tokenRes.json()

      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: 'no-store',
      })
      if (!userRes.ok) return NextResponse.redirect(new URL('/?error=user', BASE_URL))
      const du = await userRes.json()

      const isAdmin = String(du.id) === String(ADMIN_DISCORD_ID)
      let profile = await getProfileByDiscordId(du.id)
      if (!profile) {
        profile = await insertProfile({
          discord_id: du.id,
          username: du.username,
          global_name: du.global_name || null,
          avatar: du.avatar || null,
          email: du.email || null,
          is_admin: isAdmin,
          status: isAdmin ? 'active' : 'pending',
          rank: isAdmin ? 'Premium' : null,
          api_key: isAdmin ? newApiKey() : null,
          config: {},
        })
      } else {
        const patch = {
          username: du.username,
          global_name: du.global_name || null,
          avatar: du.avatar || null,
          email: du.email || null,
        }
        if (isAdmin && !profile.is_admin) { patch.is_admin = true; patch.status = 'active'; patch.rank = profile.rank || 'Premium' }
        if (isAdmin && !profile.api_key) patch.api_key = newApiKey()
        profile = await updateProfile(profile.id, patch)
      }

      if (!profile || !profile.id) return NextResponse.redirect(new URL('/?error=profile', BASE_URL))

      const sessionToken = signSession({ id: profile.id, discord_id: profile.discord_id, iat: Date.now() })
      const res = NextResponse.redirect(new URL('/', BASE_URL))
      res.cookies.set(COOKIE, sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
      res.cookies.set('obsidian_state', '', { path: '/', maxAge: 0 })
      return res
    } catch (e) {
      console.error('CALLBACK ERROR:', e?.message, e?.status, JSON.stringify(e?.data))
      const reason = encodeURIComponent(String(e?.message || 'unknown').slice(0, 120))
      return NextResponse.redirect(new URL('/?error=db&reason=' + reason, BASE_URL))
    }
  }

  if (route === '/auth/me') {
    const profile = await requireProfile(request)
    if (!profile) return json({ user: null }, 200)
    return json({ user: sanitizeProfile(profile) })
  }

  if (route === '/parameters') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    const params = await listParameters()
    return json({ parameters: params })
  }

  if (route === '/config') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    return json({
      config: profile.config || {},
      webhook_url: profile.webhook_url || '',
      rank: profile.rank,
      status: profile.status,
      embed_config: { ...DEFAULT_EMBED(), ...(profile.embed_config || {}) },
      last_sync: profile.last_sync || null,
      last_place_id: profile.last_place_id || null,
      last_job_id: profile.last_job_id || null,
      online: profile.last_sync ? (Date.now() - new Date(profile.last_sync).getTime() < ONLINE_THRESHOLD_MS) : false,
    })
  }

  if (route === '/detections') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    const type = url.searchParams.get('type') || undefined
    const player = url.searchParams.get('player') || undefined
    const targetId = (profile.is_admin && url.searchParams.get('profile_id')) || profile.id
    const detections = await listDetections(targetId, { type, player, limit: 200 })
    return json({ detections })
  }

  if (route === '/stats') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    const targetId = (profile.is_admin && url.searchParams.get('profile_id')) || profile.id
    const rows = await listDetections(targetId, { limit: 1000 })
    return json(computeStats(rows))
  }

  if (route === '/blacklist') {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    let list = []
    try { list = await listBlacklist() } catch (e) { list = [] }
    return json({ blacklist: list || [] })
  }

  if (route === '/admin/users') {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    const users = await listProfiles()
    return json({ users: users.map(sanitizeProfile) })
  }

  if (route === '/roblox/config') {
    return await robloxConfig(request, url)
  }

  return json({ error: `Route ${route} not found` }, 404)
}

// ---------------------------------------------------------------- POST
async function handlePOST(request, route, url) {
  if (route === '/auth/logout') {
    const res = json({ ok: true })
    res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 })
    return res
  }

  // Test-only login (gated by server secret) to allow automated backend testing.
  // Desactive en production (Vercel) pour supprimer le backdoor admin.
  if (route === '/auth/dev-login') {
    if (process.env.NODE_ENV === 'production') return json({ error: 'not_found' }, 404)
    const body = await request.json().catch(() => ({}))
    if (!body.secret || body.secret !== process.env.SESSION_SECRET) return json({ error: 'forbidden' }, 403)
    let profile = await getProfileByDiscordId(body.discord_id)
    if (!profile) {
      profile = await insertProfile({
        discord_id: String(body.discord_id),
        username: body.username || 'tester',
        global_name: body.global_name || body.username || 'Tester',
        avatar: null,
        email: body.email || null,
        is_admin: !!body.is_admin,
        status: body.status || 'active',
        rank: body.rank !== undefined ? body.rank : 'Freemium',
        api_key: body.api_key || newApiKey(),
        config: {},
      })
    }
    const token = signSession({ id: profile.id, discord_id: profile.discord_id, iat: Date.now() })
    const res = json({ user: sanitizeProfile(profile) })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  }

  if (route === '/roblox/config') {
    return await robloxConfig(request, url)
  }

  // Roblox: signaler une detection (log + envoi webhook cote serveur)
  if (route === '/roblox/detection') {
    const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key')
    if (!apiKey) return json({ error: 'missing_api_key' }, 400)
    const profile = await getProfileByApiKey(apiKey)
    if (!profile) return json({ error: 'invalid_api_key' }, 401)
    if (profile.status !== 'active') return json({ error: 'inactive_account' }, 403)
    const body = await request.json().catch(() => ({}))
    const detection = {
      profile_id: profile.id,
      player_name: body.player_name || body.plr || null,
      player_id: body.player_id != null ? String(body.player_id) : null,
      detection_type: body.detection_type || body.detection || 'inconnu',
      sanction: body.sanction || body.type_sanction || 'kick',
      message: body.message || body.message_kick || '',
      place_id: body.place_id != null ? String(body.place_id) : null,
      job_id: body.job_id || null,
    }
    let saved = null
    try { saved = await insertDetection(detection) } catch (e) { console.error('detection insert', e?.message) }
    try {
      await updateProfile(profile.id, {
        last_sync: new Date().toISOString(),
        last_place_id: detection.place_id,
        last_job_id: detection.job_id,
      })
    } catch (e) {}
    let sent = false
    let webhookError = null
    if (isValidDiscordWebhook(profile.webhook_url)) {
      const result = await sendDiscordWebhook(profile.webhook_url.trim(), buildEmbed(profile, detection))
      sent = result.ok
      webhookError = result.ok ? null : result.error
    } else if (profile.webhook_url) {
      webhookError = 'invalid_webhook'
    }
    return json({ ok: true, id: saved?.id || null, webhook_sent: sent, ...(webhookError ? { webhook_error: webhookError } : {}) })
  }

  if (route === '/integration/regenerate-key') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    if (profile.status !== 'active') return json({ error: 'not_active' }, 403)
    const updated = await updateProfile(profile.id, { api_key: newApiKey() })
    return json({ api_key: updated.api_key })
  }

  if (route === '/webhook/test') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    const body = await request.json().catch(() => ({}))
    const wh = body.webhook_url || profile.webhook_url
    if (!wh) return json({ error: 'no_webhook' }, 400)
    if (!isValidDiscordWebhook(wh)) return json({ error: 'invalid_webhook' }, 400)
    const payload = {
      embeds: [{
        title: '🚨 Alerte Anti-Cheat : Test (TEST)',
        color: 15158332,
        fields: [
          { name: 'Joueur', value: '**Nom :** `TestPlayer`\n**UserId :** `1`', inline: false },
          { name: 'Raison envoyée', value: '```Ceci est un test depuis le panel Obsidian```', inline: false },
        ],
        footer: { text: 'Obsidian Anticheat - ' + new Date().toLocaleDateString('fr-FR') },
      }],
    }
    const result = await sendDiscordWebhook(wh.trim(), payload)
    if (!result.ok) {
      return json({ error: 'webhook_failed', status: result.status || 502, detail: result.error }, 400)
    }
    return json({ ok: true })
  }

  if (route === '/blacklist') {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    const body = await request.json().catch(() => ({}))
    const playerId = body.player_id != null ? String(body.player_id).trim() : ''
    if (!playerId) return json({ error: 'player_id_required' }, 400)
    try {
      const exists = await getBlacklistEntry(playerId)
      if (exists) return json({ error: 'already_blacklisted', entry: exists }, 409)
      const entry = await insertBlacklist({
        player_id: playerId,
        player_name: body.player_name ? String(body.player_name).slice(0, 120) : null,
        reason: body.reason ? String(body.reason).slice(0, 300) : null,
      })
      return json({ entry })
    } catch (e) {
      return json({ error: 'blacklist_error' }, 500)
    }
  }

  if (route === '/admin/parameters') {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    const body = await request.json()
    if (!body.key || !body.label) return json({ error: 'key and label required' }, 400)
    const created = await insertParameter({
      key: body.key,
      label: body.label,
      description: body.description || '',
      category: body.category || 'Autre',
      type: body.type || 'boolean',
      default_value: body.default_value ?? (body.type === 'number' ? 0 : body.type === 'text' ? '' : false),
      min_rank: body.min_rank || 'Freemium',
      sort_order: body.sort_order ?? 999,
    })
    return json({ parameter: created })
  }

  return json({ error: `Route ${route} not found` }, 404)
}

// ---------------------------------------------------------------- PUT
async function handlePUT(request, route) {
  if (route === '/config') {
    const profile = await requireProfile(request)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    if (profile.status !== 'active') return json({ error: 'not_active' }, 403)
    const body = await request.json()
    const params = await listParameters()
    const paramMap = {}
    params.forEach((p) => (paramMap[p.key] = p))
    const newConfig = { ...(profile.config || {}) }
    if (body.config && typeof body.config === 'object') {
      for (const [key, value] of Object.entries(body.config)) {
        const p = paramMap[key]
        if (!p) continue
        if (isLocked(p, profile)) continue
        newConfig[key] = value
      }
    }
    const patch = { config: newConfig }
    if (typeof body.webhook_url === 'string') {
      const wh = body.webhook_url.trim()
      if (wh !== '' && !isValidDiscordWebhook(wh)) return json({ error: 'invalid_webhook' }, 400)
      patch.webhook_url = wh
    }
    if (body.embed_config && typeof body.embed_config === 'object') {
      patch.embed_config = { ...DEFAULT_EMBED(), ...(profile.embed_config || {}), ...body.embed_config }
    }
    const updated = await updateProfile(profile.id, patch)
    return json({ config: updated.config, webhook_url: updated.webhook_url, embed_config: updated.embed_config })
  }

  const userMatch = route.match(/^\/admin\/users\/([^/]+)$/)
  if (userMatch) {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    const targetId = userMatch[1]
    const body = await request.json()
    const patch = {}
    if (body.status) patch.status = body.status
    if (body.rank !== undefined) patch.rank = body.rank
    if (typeof body.is_admin === 'boolean') patch.is_admin = body.is_admin
    if (patch.status === 'active') {
      const target = await getProfileById(targetId)
      if (target && !target.api_key) patch.api_key = newApiKey()
    }
    const updated = await updateProfile(targetId, patch)
    return json({ user: sanitizeProfile(updated) })
  }

  const paramMatch = route.match(/^\/admin\/parameters\/([^/]+)$/)
  if (paramMatch) {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    const body = await request.json()
    const patch = {}
    for (const f of ['key', 'label', 'description', 'category', 'type', 'default_value', 'min_rank', 'sort_order']) {
      if (body[f] !== undefined) patch[f] = body[f]
    }
    const updated = await updateParameter(paramMatch[1], patch)
    return json({ parameter: updated })
  }

  return json({ error: `Route ${route} not found` }, 404)
}

// ---------------------------------------------------------------- DELETE
async function handleDELETE(request, route) {
  const blMatch = route.match(/^\/blacklist\/([^/]+)$/)
  if (blMatch) {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    try { await deleteBlacklist(blMatch[1]) } catch (e) { return json({ error: 'blacklist_error' }, 500) }
    return json({ ok: true })
  }

  const paramMatch = route.match(/^\/admin\/parameters\/([^/]+)$/)
  if (paramMatch) {
    const profile = await requireProfile(request)
    if (!profile || !profile.is_admin) return json({ error: 'forbidden' }, 403)
    await deleteParameter(paramMatch[1])
    return json({ ok: true })
  }
  return json({ error: `Route ${route} not found` }, 404)
}

async function robloxConfig(request, url) {
  const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key')
  if (!apiKey) return json({ error: 'missing_api_key' }, 400)
  const profile = await getProfileByApiKey(apiKey)
  if (!profile) return json({ error: 'invalid_api_key' }, 401)
  if (profile.status !== 'active') return json({ error: 'inactive_account' }, 403)
  const params = await listParameters()
  const config = buildRobloxConfig(params, profile)
  // Blacklist GLOBALE (admin) appliquee a tous les clients (non bloquant si la table n'existe pas encore)
  try {
    const bl = await listBlacklist()
    config.blacklist = (bl || []).map((b) => {
      const n = Number(b.player_id)
      return Number.isFinite(n) ? n : b.player_id
    })
  } catch (e) { config.blacklist = [] }
  // Enregistre la derniere synchronisation (statut en direct)
  const placeId = url.searchParams.get('place_id') || request.headers.get('x-place-id') || null
  const jobId = url.searchParams.get('job_id') || request.headers.get('x-job-id') || null
  try {
    await updateProfile(profile.id, {
      last_sync: new Date().toISOString(),
      last_place_id: placeId,
      last_job_id: jobId,
    })
  } catch (e) { /* non bloquant */ }
  return json(config)
}

function computeStats(rows) {
  const list = Array.isArray(rows) ? rows : []
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const total = list.length

  const byTypeMap = {}
  const bySanctionMap = {}
  const byPlayerMap = {}
  let last24h = 0
  let last7d = 0

  for (const d of list) {
    const t = d.detection_type || 'inconnu'
    byTypeMap[t] = (byTypeMap[t] || 0) + 1
    const s = d.sanction || 'inconnu'
    bySanctionMap[s] = (bySanctionMap[s] || 0) + 1
    const p = d.player_name || 'inconnu'
    byPlayerMap[p] = (byPlayerMap[p] || 0) + 1
    const ts = d.created_at ? new Date(d.created_at).getTime() : 0
    if (ts && now - ts < DAY) last24h += 1
    if (ts && now - ts < 7 * DAY) last7d += 1
  }

  // Timeline des 14 derniers jours (du plus ancien au plus recent)
  const days = []
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now - i * DAY)
    const key = day.toISOString().slice(0, 10)
    days.push({ date: key, count: 0 })
  }
  const dayIndex = {}
  days.forEach((d, i) => (dayIndex[d.date] = i))
  for (const d of list) {
    if (!d.created_at) continue
    const key = new Date(d.created_at).toISOString().slice(0, 10)
    if (dayIndex[key] !== undefined) days[dayIndex[key]].count += 1
  }

  const toSorted = (map) =>
    Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

  return {
    total,
    last24h,
    last7d,
    unique_players: Object.keys(byPlayerMap).length,
    by_type: toSorted(byTypeMap),
    by_sanction: toSorted(bySanctionMap),
    top_players: toSorted(byPlayerMap).slice(0, 10),
    timeline: days,
  }
}

function sanitizeProfile(p) {
  if (!p) return null
  return {
    id: p.id,
    discord_id: p.discord_id,
    username: p.username,
    global_name: p.global_name,
    avatar: p.avatar,
    email: p.email,
    is_admin: p.is_admin,
    status: p.status,
    rank: p.rank,
    api_key: p.api_key,
    webhook_url: p.webhook_url,
    embed_config: { ...DEFAULT_EMBED(), ...(p.embed_config || {}) },
    last_sync: p.last_sync || null,
    last_place_id: p.last_place_id || null,
    last_job_id: p.last_job_id || null,
    online: p.last_sync ? (Date.now() - new Date(p.last_sync).getTime() < ONLINE_THRESHOLD_MS) : false,
    created_at: p.created_at,
  }
}

async function handler(request, context) {
  try {
    const params = await context.params
    const path = params?.path || []
    const route = `/${path.join('/')}`
    const url = new URL(request.url)
    const method = request.method

    if (method === 'GET') return await handleGET(request, route, url)
    if (method === 'POST') return await handlePOST(request, route, url)
    if (method === 'PUT') return await handlePUT(request, route)
    if (method === 'DELETE') return await handleDELETE(request, route)
    return json({ error: 'method not allowed' }, 405)
  } catch (error) {
    console.error('API Error:', error?.message, error?.data)
    return json({ error: 'internal_error', detail: error?.message }, 500)
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
