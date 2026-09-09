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
} from '@/lib/supabaseRest'
import { signSession, verifySession, newApiKey } from '@/lib/session'

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

    const sessionToken = signSession({ id: profile.id, discord_id: profile.discord_id, iat: Date.now() })
    const res = NextResponse.redirect(new URL('/', BASE_URL))
    res.cookies.set(COOKIE, sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    res.cookies.set('obsidian_state', '', { path: '/', maxAge: 0 })
    return res
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
    return json({ config: profile.config || {}, webhook_url: profile.webhook_url || '', rank: profile.rank, status: profile.status })
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

  if (route === '/roblox/config') {
    return await robloxConfig(request, url)
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
    try {
      const r = await fetch(wh, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) return json({ error: 'webhook_failed', status: r.status }, 400)
      return json({ ok: true })
    } catch (e) {
      return json({ error: 'webhook_failed' }, 400)
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
    if (typeof body.webhook_url === 'string') patch.webhook_url = body.webhook_url
    const updated = await updateProfile(profile.id, patch)
    return json({ config: updated.config, webhook_url: updated.webhook_url })
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
  return json(config)
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
