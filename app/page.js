'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Shield, ShieldCheck, Lock, Zap, Eye, EyeOff, Copy, RefreshCw, Send, Plus, Trash2, Pencil,
  Crown, Gauge, Webhook, Code2, Users, SlidersHorizontal, LogOut, Clock, Sparkles, Github,
  Activity, Bell, MessageSquare, Wifi, WifiOff, Filter, Palette, RotateCw,
  BarChart3, TrendingUp, Users2, Ban,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'

const HERO_IMG = 'https://images.unsplash.com/photo-1563089145-599997674d42?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmt8ZW58MHx8fHB1cnBsZXwxNzg4OTg5OTcwfDA&ixlib=rb-4.1.0&q=85'
const FEATURE_IMG = 'https://images.unsplash.com/photo-1602042808032-fca7e25659cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwc2hpZWxkfGVufDB8fHxwdXJwbGV8MTc4ODk4OTk2MXww&ixlib=rb-4.1.0&q=85'

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

function avatarUrl(u) {
  if (u?.avatar && u?.discord_id) return `https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=128`
  return undefined
}

function RankBadge({ rank }) {
  if (rank === 'Premium') return <Badge className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black border-0"><Crown className="w-3 h-3 mr-1" />Premium</Badge>
  if (rank === 'Freemium') return <Badge variant="secondary"><Gauge className="w-3 h-3 mr-1" />Freemium</Badge>
  return <Badge variant="outline" className="text-muted-foreground">Aucun</Badge>
}

function StatusBadge({ status }) {
  if (status === 'active') return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Actif</Badge>
  if (status === 'pending') return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">En attente</Badge>
  return <Badge variant="destructive">{status}</Badge>
}

/* ----------------------------------------------------------------- LANDING */
function Landing() {
  const features = [
    { icon: Shield, number: '19+', title: 'Détections actives', desc: 'Freecam, Fly, Remote Spy, Btools et plus.' },
    { icon: Zap, number: '<1s', title: 'Temps de réaction', desc: 'Chaque signal est transmis sans délai.' },
    { icon: Webhook, number: '24/7', title: 'Alertes Discord', desc: 'Gardez une trace de chaque événement.' },
  ]
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-50 landing-nav">
        <div className="container flex items-center justify-between h-[72px]">
          <a href="#top" className="flex items-center gap-3 font-display font-bold tracking-[0.18em] text-sm"><div className="brand-mark"><Shield className="w-4 h-4" /></div><span>OBSIDIAN<span className="text-primary">.</span></span></a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground"><a href="#features" className="landing-link">Fonctionnalités</a><a href="#plans" className="landing-link">Formules</a><span className="flex items-center gap-2 text-emerald-400"><span className="status-dot" /> Système opérationnel</span></div>
          <Button asChild size="sm" className="discord-button"><a href="/api/auth/discord/login"><DiscordIcon /> Connexion</a></Button>
        </div>
      </nav>

      <main id="top">
        <section className="landing-hero relative overflow-hidden">
          <div className="container relative grid lg:grid-cols-[1.02fr_0.98fr] gap-14 items-center pt-36 pb-24 lg:pt-44 lg:pb-32">
            <div className="max-w-2xl"><div className="eyebrow"><span className="eyebrow-line" /> ROBLOX SECURITY / 01</div><h1 className="font-display text-5xl sm:text-6xl lg:text-[5.6rem] font-semibold leading-[0.94] tracking-[-0.045em] mt-5">La sécurité<br /><span className="gradient-text">sans angle mort.</span></h1><p className="mt-7 max-w-xl text-base sm:text-lg leading-8 text-muted-foreground">Obsidian donne à votre équipe une vision claire de chaque menace. Détectez, configurez et réagissez depuis un seul centre de contrôle.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Button asChild size="lg" className="discord-button h-12 px-6 text-sm"><a href="/api/auth/discord/login"><DiscordIcon /> Ouvrir le dashboard</a></Button><a href="#features" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">Voir les capacités <span aria-hidden>↗</span></a></div><div className="mt-12 flex items-center gap-6 text-xs text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Configuration distante</span><span className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Clé API chiffrée</span></div></div>
            <div className="dashboard-preview" aria-label="Aperçu fictif du dashboard Obsidian"><div className="preview-topbar"><span className="preview-dots"><i /><i /><i /></span><span>obsidian / demo account</span><span className="preview-live"><span className="status-dot" /> DEMO</span></div><div className="preview-body"><div className="preview-sidebar"><div className="preview-logo"><Shield className="w-4 h-4" /></div><span className="preview-active"><BarChart3 /></span><span><SlidersHorizontal /></span><span><Bell /></span><span><Users /></span></div><div className="preview-content"><div className="flex items-start justify-between"><div><p className="preview-kicker">OVERVIEW / SAMPLE DATA</p><h2>Votre jeu, sous contrôle.</h2></div><span className="preview-date">09 SEPT 2026</span></div><div className="preview-stats"><div><span>INCIDENTS</span><strong>03</strong><em>− 18% cette semaine</em></div><div><span>JOUEURS SCANNÉS</span><strong>12.4k</strong><em>+ 24% cette semaine</em></div></div><div className="preview-chart"><div className="chart-label"><span>ACTIVITÉ DES DÉTECTIONS</span><span>24H</span></div><div className="chart-bars">{[32, 48, 38, 62, 45, 78, 55, 88, 64, 74, 52, 92].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div><div className="preview-events"><div><span className="event-dot red" /><span><b>Remote Spy détecté</b><small>il y a 2 min · player_4821</small></span><strong>ÉLEVÉ</strong></div><div><span className="event-dot yellow" /><span><b>Vitesse inhabituelle</b><small>il y a 8 min · player_1093</small></span><strong>MOYEN</strong></div></div></div></div></div>
          </div>
        </section>

        <section id="features" className="container landing-features py-20 lg:py-28"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"><div><div className="eyebrow"><span className="eyebrow-line" /> POUR LES ÉQUIPES QUI AVANCENT</div><h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-4">Tout voir. Décider vite.</h2></div><p className="max-w-sm text-sm leading-6 text-muted-foreground">Une couche de sécurité lisible, pensée pour les jeux qui ne peuvent pas se permettre de perdre le contrôle.</p></div><div className="grid md:grid-cols-3 gap-px bg-border border border-border">{features.map((f) => <div key={f.title} className="feature-block"><div className="flex items-center justify-between"><div className="feature-icon"><f.icon className="w-5 h-5" /></div><span className="feature-number">{f.number}</span></div><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div></section>

        <section id="plans" className="container pb-24 lg:pb-32"><div className="plans-panel"><div><div className="eyebrow"><span className="eyebrow-line" /> UNE ÉVOLUTION SIMPLE</div><h2 className="font-display text-3xl sm:text-4xl font-semibold mt-4">Commencez léger.<br /><span className="text-primary">Passez au niveau supérieur.</span></h2><p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">Les protections essentielles dès le premier jour, puis toute la puissance d’Obsidian lorsque votre communauté grandit.</p></div><div className="plan-list"><div className="plan-row"><span className="plan-tag">01</span><div><h3>Freemium</h3><p>Les détections essentielles pour démarrer.</p></div><Gauge className="w-5 h-5 text-muted-foreground" /></div><div className="plan-row active"><span className="plan-tag">02</span><div><h3>Premium</h3><p>Les protections avancées, sans compromis.</p></div><Crown className="w-5 h-5 text-amber-400" /></div></div></div></section>
      </main>
      <footer className="landing-footer"><div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><span className="font-display tracking-[0.16em] text-xs font-bold">OBSIDIAN<span className="text-primary">.</span></span><span>Anticheat Roblox indépendant · {new Date().getFullYear()}</span></div></footer>
    </div>
  )
}

function LegacyLanding() {
  const features = [
    { icon: Shield, title: '19+ Detections', desc: 'Freecam, Fly, Remote Spy, Hitbox Expander, Btools et bien plus.' },
    { icon: Zap, title: 'Configuration a distance', desc: 'Modifiez tous vos parametres sans jamais ouvrir Roblox Studio.' },
    { icon: Webhook, title: 'Webhooks Discord', desc: 'Recevez chaque detection en temps reel dans votre serveur.' },
    { icon: ShieldCheck, title: 'Protection avancee', desc: 'Faux remotes, protection console et systemes admin supportes.' },
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            OBSIDIAN
          </div>
          <Button asChild className="bg-[#5865F2] hover:bg-[#4752c4] text-white">
            <a href="/api/auth/discord/login"><DiscordIcon /> Se connecter</a>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-28 overflow-hidden grid-bg">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>
        <div className="container text-center max-w-3xl">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10">
            <Sparkles className="w-3 h-3 mr-1" /> Anticheat Roblox nouvelle generation
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
            Protegez votre jeu avec <span className="gradient-text">Obsidian</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Le pont intelligent entre Roblox et votre anticheat. Configurez detections, protections et webhooks
            depuis un dashboard elegant, en un clic.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#4752c4] text-white h-12 px-7 text-base">
              <a href="/api/auth/discord/login"><DiscordIcon /> Continuer avec Discord</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base border-border">
              <a href="#features">Decouvrir</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="grid md:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <Card key={i} className="bg-card/60 border-border hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-2">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{f.desc}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Split showcase */}
      <section className="container py-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden border border-border glow">
            <img src={FEATURE_IMG} alt="" className="w-full h-72 object-cover" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold mb-4">Un panel, un controle total</h2>
            <p className="text-muted-foreground mb-4">
              Ajoutez de nouveaux parametres, activez ou desactivez des detections, gerez vos webhooks
              et vos comptes clients. Tout est synchronise instantanement avec votre script Roblox via une simple cle API.
            </p>
            <ul className="space-y-2 text-sm">
              {['Detections activables en 1 clic', 'Webhook Discord personnalisable', 'Cle API securisee pour Roblox', 'Systemes admin (HD Admin, Adonis, Kohl...)'].map((t) => (
                <li key={t} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ranks */}
      <section className="container py-20">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Deux formules</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="bg-card/60 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gauge className="w-5 h-5" /> Freemium</CardTitle>
              <CardDescription>Les detections essentielles pour securiser votre jeu.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Freecam, Fly, Remote Spy, Btools, CoreGui V1...</p>
              <p>Webhook Discord & cle API inclus.</p>
            </CardContent>
          </Card>
          <Card className="bg-card/60 border-primary/40 glow relative">
            <div className="absolute -top-3 right-4"><RankBadge rank="Premium" /></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Premium</CardTitle>
              <CardDescription>Toutes les detections avancees debloquees.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>CoreGui V2, Async, Animation, Hook, protections avancees.</p>
              <p>Ecran de detection personnalise (image + son).</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-10">
          <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#4752c4] text-white">
            <a href="/api/auth/discord/login"><DiscordIcon /> Rejoindre Obsidian</a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Obsidian Anticheat &copy; {new Date().getFullYear()} &mdash; Le pont entre Roblox et vous.
      </footer>
    </div>
  )
}

function DiscordIcon() {
  return <img src="/Discord_Logo_sans_texte.svg" alt="" aria-hidden="true" className="w-4 h-5 mr-2 brightness-0 invert" />
}

/* ----------------------------------------------------------------- PENDING */
function Pending({ me, onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      <Card className="max-w-md w-full bg-card/70 border-border text-center">
        <CardHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-2">
            <Clock className="w-7 h-7 text-amber-400" />
          </div>
          <CardTitle>Compte en attente</CardTitle>
          <CardDescription>Bonjour {me.global_name || me.username}, ton compte a bien ete cree.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Un administrateur doit t'attribuer un rang (Freemium ou Premium) avant que tu puisses acceder au dashboard.
          </p>
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3">
            Ton Discord ID : <span className="font-mono text-foreground">{me.discord_id}</span>
          </div>
          <Button variant="outline" onClick={onLogout} className="w-full"><LogOut className="w-4 h-4 mr-2" />Se deconnecter</Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------------- CONFIG TAB */
function ConfigTab({ me, params, config, onSaved }) {
  const locked = (p) => p.min_rank === 'Premium' && me.rank !== 'Premium' && !me.is_admin
  const [values, setValues] = useState(() => {
    const init = {}
    params.forEach((p) => { init[p.key] = config[p.key] !== undefined ? config[p.key] : p.default_value })
    return init
  })
  const [saving, setSaving] = useState(false)

  const categories = useMemo(() => {
    const map = new Map()
    params.forEach((p) => { if (!map.has(p.category)) map.set(p.category, []); map.get(p.category).push(p) })
    return Array.from(map.entries())
  }, [params])

  const setVal = (key, v) => setValues((s) => ({ ...s, [key]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api('/config', { method: 'PUT', body: JSON.stringify({ config: values }) })
      toast.success('Configuration enregistree')
      onSaved && onSaved()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {categories.map(([cat, list]) => (
        <Card key={cat} className="bg-card/60 border-border">
          <CardHeader><CardTitle className="text-lg font-display">{cat}</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {list.map((p) => {
              const lk = locked(p)
              return (
                <div key={p.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{p.label}</span>
                      {p.min_rank === 'Premium' && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400"><Crown className="w-2.5 h-2.5 mr-0.5" />Premium</Badge>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {lk && <Lock className="w-4 h-4 text-muted-foreground" />}
                    {p.type === 'boolean' && (
                      <Switch checked={!!values[p.key]} disabled={lk} onCheckedChange={(v) => setVal(p.key, v)} />
                    )}
                    {p.type === 'number' && (
                      <Input type="number" className="w-28" disabled={lk} value={values[p.key] ?? 0}
                        onChange={(e) => setVal(p.key, e.target.value === '' ? 0 : Number(e.target.value))} />
                    )}
                    {p.type === 'text' && (
                      <Input className="w-52" disabled={lk} value={values[p.key] ?? ''}
                        onChange={(e) => setVal(p.key, e.target.value)} />
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="glow">{saving ? 'Enregistrement...' : 'Enregistrer la configuration'}</Button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- WEBHOOK TAB */
function WebhookTab({ initial }) {
  const [url, setUrl] = useState(initial || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api('/config', { method: 'PUT', body: JSON.stringify({ webhook_url: url }) })
      toast.success('Webhook enregistre')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  const test = async () => {
    setTesting(true)
    try {
      await api('/webhook/test', { method: 'POST', body: JSON.stringify({ webhook_url: url }) })
      toast.success('Message de test envoye sur Discord')
    } catch (e) { toast.error('Echec de l envoi. Verifie l URL du webhook.') } finally { setTesting(false) }
  }

  return (
    <Card className="bg-card/60 border-border max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5 text-primary" /> Webhook Discord</CardTitle>
        <CardDescription>Recevez toutes les detections directement dans votre serveur Discord.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>URL du webhook</Label>
          <Input placeholder="https://discord.com/api/webhooks/..." value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>{saving ? '...' : 'Enregistrer'}</Button>
          <Button variant="outline" onClick={test} disabled={testing || !url}><Send className="w-4 h-4 mr-2" />{testing ? 'Envoi...' : 'Envoyer un test'}</Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------------- INTEGRATION TAB */
function IntegrationTab({ me, onKey }) {
  const [reveal, setReveal] = useState(false)
  const [regen, setRegen] = useState(false)
  const [key, setKey] = useState(me.api_key || '')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const script = `local HttpService = game:GetService("HttpService")
local BASE = "${origin}/api/roblox"
local KEY = "${key || 'VOTRE_CLE_API'}"
local parametre = {}
local jobid = game.JobId ~= "" and game.JobId or "Studio"
local ok, res = pcall(function()
        return HttpService:RequestAsync({ Url = BASE .. "/config?place_id=" .. game.PlaceId .. "&job_id=" .. HttpService:UrlEncode(jobid), Method = "GET", Headers = { ["x-api-key"] = KEY } })
end)
if ok and res.Success then
        parametre = HttpService:JSONDecode(res.Body)
end
parametre.core_remove = {
        Enum.CoreGuiType.Captures,
        Enum.CoreGuiType.SelfView,
        Enum.CoreGuiType.ExperienceShop,
        Enum.CoreGuiType.AvatarSwitcher,
        Enum.CoreGuiType.EmotesMenu
}
parametre.blacklist = parametre.blacklist or {}
function parametre.est_banni(userId)
        for _, id in ipairs(parametre.blacklist) do
                if id == userId then return true end
        end
        return false
end
function parametre.verifier_blacklist(plr)
        if parametre.est_banni(plr.UserId) then
                plr:Kick("[Obsidian] Vous etes sur la blacklist de ce jeu.")
                return true
        end
        return false
end
function parametre.creer_embed(plr, detection, message_kick, type_sanction)
        return {
                ["embeds"] = {
                        {
                                ["title"] = string.format("Alerte Anti-Cheat : %s (%s)", detection, type_sanction),
                                ["color"] = 15158332,
                                ["fields"] = {
                                        { ["name"] = "Joueur", ["value"] = string.format("Nom : %s\\nUserId : %d", plr.Name, plr.UserId), ["inline"] = false },
                                        { ["name"] = "Serveur", ["value"] = string.format("PlaceId : %d\\nJobId : %s", game.PlaceId, game.JobId ~= "" and game.JobId or "Studio"), ["inline"] = false },
                                        { ["name"] = "Raison", ["value"] = string.format("%s", message_kick), ["inline"] = false }
                                },
                                ["footer"] = { ["text"] = "Obsidian Anticheat" }
                        }
                }
        }
end
function parametre.signaler(plr, detection, message_kick, type_sanction)
        pcall(function()
                HttpService:RequestAsync({
                        Url = BASE .. "/detection",
                        Method = "POST",
                        Headers = { ["x-api-key"] = KEY, ["Content-Type"] = "application/json" },
                        Body = HttpService:JSONEncode({ player_name = plr.Name, player_id = plr.UserId, detection = detection, message = message_kick, sanction = type_sanction, place_id = game.PlaceId, job_id = jobid })
                })
        end)
end
return parametre`

  const regenerate = async () => {
    setRegen(true)
    try {
      const d = await api('/integration/regenerate-key', { method: 'POST' })
      setKey(d.api_key)
      onKey && onKey(d.api_key)
      toast.success('Nouvelle cle API generee')
    } catch (e) { toast.error(e.message) } finally { setRegen(false) }
  }

  const copy = (txt, msg) => { navigator.clipboard.writeText(txt); toast.success(msg) }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Cle API</CardTitle>
          <CardDescription>Cette cle relie votre script Roblox a votre configuration. Ne la partagez jamais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input readOnly value={reveal ? key : (key ? '\u2022'.repeat(28) : 'Aucune cle')} className="font-mono" />
            <Button variant="outline" size="icon" onClick={() => setReveal((r) => !r)}>{reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
            <Button variant="outline" size="icon" onClick={() => copy(key, 'Cle copiee')} disabled={!key}><Copy className="w-4 h-4" /></Button>
          </div>
          <Button variant="outline" onClick={regenerate} disabled={regen}><RefreshCw className="w-4 h-4 mr-2" />{regen ? 'Generation...' : 'Regenerer la cle'}</Button>
        </CardContent>
      </Card>

      {me.is_admin ? (
        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Script Roblox (module parametre) <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">Admin</span></CardTitle>
            <CardDescription>Module reserve a l'administrateur. Il recupere automatiquement la configuration. Ne le partagez pas publiquement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea readOnly value={script} className="font-mono text-xs h-72 bg-black/40" />
            <Button variant="outline" onClick={() => copy(script, 'Script copie')}><Copy className="w-4 h-4 mr-2" />Copier le script</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Script Roblox</CardTitle>
            <CardDescription>Le module anticheat est fourni par l'administrateur Obsidian. Renseignez simplement votre cle API ci-dessus dans le script qui vous a ete remis.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Pour obtenir le module ou de l'aide a l'installation, contactez l'equipe Obsidian. Votre cle API suffit pour lier votre jeu a cette configuration.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- ADMIN: USERS */
function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api('/admin/users'); setUsers(d.users) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const update = async (id, patch) => {
    try {
      const d = await api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
      setUsers((us) => us.map((u) => (u.id === id ? d.user : u)))
      toast.success('Compte mis a jour')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Comptes clients ({users.length})</CardTitle>
        <CardDescription>Attribuez un rang et activez les comptes.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead>Script Roblox</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8"><AvatarImage src={avatarUrl(u)} /><AvatarFallback>{(u.username || '?')[0].toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">{u.global_name || u.username}{u.is_admin && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Admin</Badge>}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.discord_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select value={u.status} onValueChange={(v) => update(u.id, { status: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="banned">Banni</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={u.rank || 'none'} onValueChange={(v) => update(u.id, { rank: v === 'none' ? null : v, status: 'active' })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      <SelectItem value="Freemium">Freemium</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <OnlineDot online={u.online} />
                    <span className="text-[11px] text-muted-foreground">{u.last_sync ? timeAgo(u.last_sync) : 'jamais synchro'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------------- ADMIN: PARAMETERS */
const EMPTY_PARAM = { key: '', label: '', description: '', category: 'Detections', type: 'boolean', default_value: false, min_rank: 'Freemium', sort_order: 999 }

function AdminParameters({ params, reload }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PARAM)

  const openNew = () => { setEditing(null); setForm(EMPTY_PARAM); setOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ ...p, default_value: p.default_value })
    setOpen(true)
  }

  const coerceDefault = (f) => {
    if (f.type === 'boolean') return typeof f.default_value === 'boolean' ? f.default_value : f.default_value === 'true'
    if (f.type === 'number') return Number(f.default_value) || 0
    return String(f.default_value ?? '')
  }

  const submit = async () => {
    const payload = { ...form, default_value: coerceDefault(form), sort_order: Number(form.sort_order) || 999 }
    try {
      if (editing) await api(`/admin/parameters/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/admin/parameters', { method: 'POST', body: JSON.stringify(payload) })
      toast.success(editing ? 'Parametre modifie' : 'Parametre ajoute')
      setOpen(false)
      reload()
    } catch (e) { toast.error(e.message) }
  }

  const remove = async (p) => {
    if (!confirm(`Supprimer le parametre "${p.label}" ?`)) return
    try { await api(`/admin/parameters/${p.id}`, { method: 'DELETE' }); toast.success('Supprime'); reload() } catch (e) { toast.error(e.message) }
  }

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-primary" /> Parametres ({params.length})</CardTitle>
          <CardDescription>Ajoutez de nouveaux parametres sans toucher au code.</CardDescription>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cle</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {params.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.key}</TableCell>
                <TableCell>{p.label}</TableCell>
                <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.type}</TableCell>
                <TableCell><RankBadge rank={p.min_rank} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le parametre' : 'Nouveau parametre'}</DialogTitle>
            <DialogDescription>La cle utilise des points pour les tables imbriquees (ex: detection.fly).</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Cle</Label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="detection.newcheck" /></div>
            <div className="space-y-1"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
            <div className="space-y-1 col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Categorie</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rang minimum</Label>
              <Select value={form.min_rank} onValueChange={(v) => setForm({ ...form, min_rank: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Freemium">Freemium</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valeur par defaut</Label>
              {form.type === 'boolean' ? (
                <Select value={String(form.default_value)} onValueChange={(v) => setForm({ ...form, default_value: v === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">true</SelectItem><SelectItem value="false">false</SelectItem></SelectContent>
                </Select>
              ) : (
                <Input value={form.default_value ?? ''} onChange={(e) => setForm({ ...form, default_value: e.target.value })} />
              )}
            </div>
            <div className="space-y-1"><Label>Ordre</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={submit}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return 'jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `il y a ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

function OnlineDot({ online }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
      {online ? <span className="text-emerald-400">En ligne</span> : <span className="text-muted-foreground">Hors ligne</span>}
    </span>
  )
}

/* ----------------------------------------------------------------- STATUS TAB */
function StatusTab({ me, reloadAll }) {
  const [data, setData] = useState(null)
  const load = async () => { try { const d = await api('/config'); setData(d) } catch (e) {} }
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [])

  const online = data?.online
  return (
    <div className="grid md:grid-cols-3 gap-5 max-w-4xl">
      <Card className={`bg-card/60 border-border ${online ? 'border-emerald-500/40' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {online ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />} Script Roblox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-display font-bold ${online ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {online ? 'Connecte' : 'Deconnecte'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Base sur la derniere synchronisation (&lt; 5 min)</p>
        </CardContent>
      </Card>
      <Card className="bg-card/60 border-border">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="w-5 h-5 text-primary" /> Derniere synchro</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-display font-bold">{timeAgo(data?.last_sync)}</div>
          <p className="text-xs text-muted-foreground mt-1">{data?.last_sync ? new Date(data.last_sync).toLocaleString('fr-FR') : '—'}</p>
        </CardContent>
      </Card>
      <Card className="bg-card/60 border-border">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="w-5 h-5 text-primary" /> Serveur actif</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><span className="text-muted-foreground">PlaceId :</span> <span className="font-mono">{data?.last_place_id || '—'}</span></div>
          <div><span className="text-muted-foreground">JobId :</span> <span className="font-mono text-xs">{data?.last_job_id || '—'}</span></div>
        </CardContent>
      </Card>
      <div className="md:col-span-3">
        <Button variant="outline" onClick={load}><RotateCw className="w-4 h-4 mr-2" />Rafraichir</Button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- DETECTIONS TAB */
function DetectionsTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [player, setPlayer] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (type && type !== 'all') params.set('type', type)
      if (player) params.set('player', player)
      const d = await api('/detections' + (params.toString() ? '?' + params.toString() : ''))
      setRows(d.detections || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [type])

  const types = useMemo(() => Array.from(new Set(rows.map((r) => r.detection_type).filter(Boolean))), [rows])

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Historique des detections</CardTitle>
        <CardDescription>Toutes les detections envoyees par votre script Roblox.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Rechercher un joueur..." value={player} onChange={(e) => setPlayer(e.target.value)} className="w-56" onKeyDown={(e) => e.key === 'Enter' && load()} />
            <Button variant="outline" onClick={load}>Filtrer</Button>
          </div>
        </div>
        {loading ? <p className="text-muted-foreground text-sm">Chargement...</p> : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucune detection pour le moment.</p>
            <p className="text-xs mt-1">Les detections apparaitront ici des que ton script les signalera.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Joueur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sanction</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.player_name || '?'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.player_id || ''}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{r.detection_type}</Badge></TableCell>
                    <TableCell>{r.sanction === 'ban' ? <Badge variant="destructive">ban</Badge> : <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">{r.sanction}</Badge>}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{r.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------------- STATS TAB */
const CHART_COLORS = ['#a855f7', '#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16', '#f97316']

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Card className="bg-card/60 border-border">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
        {hint && <p className="text-[11px] text-muted-foreground mt-3">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function StatsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api('/stats'); setData(d) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading && !data) return <p className="text-muted-foreground text-sm">Chargement des statistiques...</p>

  const empty = !data || data.total === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Statistiques</h2>
          <p className="text-sm text-muted-foreground">Analyse des detections de votre anticheat.</p>
        </div>
        <Button variant="outline" onClick={load}><RotateCw className="w-4 h-4 mr-2" />Rafraichir</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield} label="Detections totales" value={data?.total ?? 0} />
        <StatCard icon={TrendingUp} label="Dernieres 24h" value={data?.last24h ?? 0} hint="Sur les 24 dernieres heures" />
        <StatCard icon={Clock} label="7 derniers jours" value={data?.last7d ?? 0} />
        <StatCard icon={Users2} label="Joueurs uniques" value={data?.unique_players ?? 0} hint="Signales au moins une fois" />
      </div>

      {empty ? (
        <Card className="bg-card/60 border-border">
          <CardContent className="text-center py-16 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucune donnee a afficher pour le moment.</p>
            <p className="text-xs mt-1">Les statistiques apparaitront des que votre script signalera des detections.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card/60 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-primary" /> Detections (14 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #ffffff22', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="count" name="Detections" stroke="#a855f7" fill="url(#gradDet)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card/60 border-border">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Filter className="w-5 h-5 text-primary" /> Par type de detection</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, (data.by_type?.length || 1) * 38)}>
                  <BarChart data={data.by_type} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#d4d4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#18181b', border: '1px solid #ffffff22', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" name="Detections" radius={[0, 4, 4, 0]}>
                      {data.by_type.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Ban className="w-5 h-5 text-primary" /> Par sanction</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, (data.by_sanction?.length || 1) * 38)}>
                  <BarChart data={data.by_sanction} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#d4d4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#18181b', border: '1px solid #ffffff22', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" name="Sanctions" radius={[0, 4, 4, 0]}>
                      {data.by_sanction.map((e, i) => <Cell key={i} fill={e.name === 'ban' ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/60 border-border">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users2 className="w-5 h-5 text-primary" /> Top joueurs signales</CardTitle></CardHeader>
            <CardContent>
              {data.top_players?.length === 0 ? <p className="text-sm text-muted-foreground">Aucun joueur.</p> : (
                <div className="space-y-2">
                  {data.top_players.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 text-center text-xs font-mono text-muted-foreground">#{i + 1}</div>
                      <div className="flex-1 font-medium truncate">{p.name}</div>
                      <div className="w-40 hidden sm:block">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(p.count / data.top_players[0].count) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                      </div>
                      <Badge variant="secondary">{p.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- BLACKLIST TAB */
function BlacklistTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ player_id: '', player_name: '', reason: '' })
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await api('/blacklist'); setRows(d.blacklist || []) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!String(form.player_id).trim()) { toast.error('UserId Roblox requis'); return }
    setAdding(true)
    try {
      await api('/blacklist', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Joueur ajoute a la blacklist')
      setForm({ player_id: '', player_name: '', reason: '' })
      load()
    } catch (e) {
      toast.error(e.message === 'already_blacklisted' ? 'Ce joueur est deja dans la blacklist' : e.message)
    } finally { setAdding(false) }
  }

  const remove = async (id) => {
    try {
      await api('/blacklist/' + id, { method: 'DELETE' })
      setRows((r) => r.filter((x) => x.id !== id))
      toast.success('Joueur retire de la blacklist')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ban className="w-5 h-5 text-primary" /> Blacklist globale <Badge variant="secondary" className="ml-1">{rows.length}</Badge></CardTitle>
          <CardDescription>
            Liste unique geree par l'administrateur, appliquee automatiquement a <span className="text-foreground font-medium">tous les jeux clients</span>.
            Le script Roblox kicke ces joueurs sur tous les serveurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">UserId Roblox *</Label>
              <Input placeholder="ex: 123456789" value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nom (optionnel)</Label>
              <Input placeholder="Pseudo" value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Raison (optionnel)</Label>
              <Input placeholder="ex: Exploit fly" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} />
            </div>
            <Button onClick={add} disabled={adding}><Plus className="w-4 h-4 mr-2" />{adding ? '...' : 'Ajouter'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border">
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground text-sm">Chargement...</p> : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ban className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Aucun joueur dans la blacklist.</p>
              <p className="text-xs mt-1">Ajoutez un UserId ci-dessus ou bannissez un joueur depuis le jeu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Joueur</TableHead>
                    <TableHead>UserId</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.player_name || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{r.player_id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.reason || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------------- EMBED TAB */
function intToHex(n) {
  const v = Number(n) || 0
  return '#' + v.toString(16).padStart(6, '0')
}
function hexToInt(hex) {
  return parseInt(String(hex).replace('#', ''), 16) || 0
}

function EmbedTab({ initial }) {
  const [cfg, setCfg] = useState(() => ({
    title: '🚨 Alerte Anti-Cheat : {detection} ({sanction})',
    color: 15158332,
    footer: 'Obsidian Anticheat',
    show_player: true, show_server: true, show_reason: true,
    ...(initial || {}),
  }))
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setCfg((s) => ({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api('/config', { method: 'PUT', body: JSON.stringify({ embed_config: cfg }) })
      toast.success('Embed enregistre')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const previewTitle = String(cfg.title || '').replaceAll('{detection}', 'Fly').replaceAll('{sanction}', 'ban').replaceAll('{player}', 'Cheater123')

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Personnalisation de l'embed</CardTitle>
          <CardDescription>Variables: {'{detection}'}, {'{sanction}'}, {'{player}'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1"><Label>Titre</Label><Input value={cfg.title} onChange={(e) => set('title', e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Couleur</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={intToHex(cfg.color)} onChange={(e) => set('color', hexToInt(e.target.value))} className="w-12 h-10 rounded-md bg-transparent border border-border cursor-pointer" />
              <Input className="w-40 font-mono" value={intToHex(cfg.color)} onChange={(e) => set('color', hexToInt(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1"><Label>Footer</Label><Input value={cfg.footer} onChange={(e) => set('footer', e.target.value)} /></div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Afficher le joueur</Label><Switch checked={cfg.show_player !== false} onCheckedChange={(v) => set('show_player', v)} /></div>
            <div className="flex items-center justify-between"><Label>Afficher les infos serveur</Label><Switch checked={cfg.show_server !== false} onCheckedChange={(v) => set('show_server', v)} /></div>
            <div className="flex items-center justify-between"><Label>Afficher la raison</Label><Switch checked={cfg.show_reason !== false} onCheckedChange={(v) => set('show_reason', v)} /></div>
          </div>
          <Button onClick={save} disabled={saving} className="glow">{saving ? 'Enregistrement...' : 'Enregistrer l embed'}</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border">
        <CardHeader><CardTitle className="text-base">Apercu</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md bg-[#2b2d31] p-3">
            <div className="flex gap-3">
              <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: intToHex(cfg.color) }} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm mb-2">{previewTitle}</div>
                {cfg.show_player !== false && (
                  <div className="mb-2"><div className="text-[#dbdee1] text-xs font-semibold">Joueur</div><div className="text-[#dbdee1] text-xs">Nom : <span className="bg-black/30 px-1 rounded">Cheater123</span> · UserId : <span className="text-[#00a8fc]">123456</span></div></div>
                )}
                {cfg.show_server !== false && (
                  <div className="mb-2"><div className="text-[#dbdee1] text-xs font-semibold">Informations serveur</div><div className="text-[#dbdee1] text-xs">PlaceId : <span className="bg-black/30 px-1 rounded">987654</span></div></div>
                )}
                {cfg.show_reason !== false && (
                  <div className="mb-2"><div className="text-[#dbdee1] text-xs font-semibold">Raison</div><div className="text-[#dbdee1] text-xs bg-black/30 rounded p-1 font-mono">Fly detecte</div></div>
                )}
                <div className="text-[#949ba4] text-[10px] mt-2">{cfg.footer} - {new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------------- DASHBOARD */
function Dashboard({ me, params, config, webhook, cfgData, reloadAll, onLogout, onKey }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 glass border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-display font-bold">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow"><Shield className="w-4 h-4 text-primary" /></div>
            OBSIDIAN
          </div>
          <div className="flex items-center gap-3">
            <OnlineDot online={cfgData?.online} />
            <RankBadge rank={me.rank} />
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8"><AvatarImage src={avatarUrl(me)} /><AvatarFallback>{(me.username || '?')[0].toUpperCase()}</AvatarFallback></Avatar>
              <span className="text-sm hidden sm:block">{me.global_name || me.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold mb-1">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mb-6">Configurez votre anticheat Obsidian a distance.</p>

        <Tabs defaultValue="status">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="status"><Activity className="w-4 h-4 mr-2" />Statut</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-2" />Stats</TabsTrigger>
            <TabsTrigger value="config"><SlidersHorizontal className="w-4 h-4 mr-2" />Configuration</TabsTrigger>
            <TabsTrigger value="detections"><Bell className="w-4 h-4 mr-2" />Detections</TabsTrigger>
            <TabsTrigger value="webhook"><Webhook className="w-4 h-4 mr-2" />Webhook</TabsTrigger>
            <TabsTrigger value="embed"><MessageSquare className="w-4 h-4 mr-2" />Embed</TabsTrigger>
            <TabsTrigger value="integration"><Code2 className="w-4 h-4 mr-2" />Integration Roblox</TabsTrigger>
            {me.is_admin && <TabsTrigger value="admin"><Crown className="w-4 h-4 mr-2" />Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="status">
            <StatusTab me={me} reloadAll={reloadAll} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
          <TabsContent value="config">
            <ConfigTab me={me} params={params} config={config} onSaved={reloadAll} />
          </TabsContent>
          <TabsContent value="detections">
            <DetectionsTab />
          </TabsContent>
          <TabsContent value="webhook">
            <WebhookTab initial={webhook} />
          </TabsContent>
          <TabsContent value="embed">
            <EmbedTab initial={cfgData?.embed_config} />
          </TabsContent>
          <TabsContent value="integration">
            <IntegrationTab me={me} onKey={onKey} />
          </TabsContent>
          {me.is_admin && (
            <TabsContent value="admin">
              <Tabs defaultValue="users">
                <TabsList className="mb-4">
                  <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Utilisateurs</TabsTrigger>
                  <TabsTrigger value="params"><SlidersHorizontal className="w-4 h-4 mr-2" />Parametres</TabsTrigger>
                  <TabsTrigger value="blacklist"><Ban className="w-4 h-4 mr-2" />Blacklist</TabsTrigger>
                </TabsList>
                <TabsContent value="users"><AdminUsers /></TabsContent>
                <TabsContent value="params"><AdminParameters params={params} reload={reloadAll} /></TabsContent>
                <TabsContent value="blacklist"><BlacklistTab /></TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- APP */
export default function App() {
  const [me, setMe] = useState(undefined)
  const [params, setParams] = useState([])
  const [config, setConfig] = useState({})
  const [webhook, setWebhook] = useState('')
  const [cfgData, setCfgData] = useState({})

  const loadAll = async () => {
    try {
      const meRes = await api('/auth/me')
      setMe(meRes.user)
      if (meRes.user) {
        const [pr, cf] = await Promise.all([api('/parameters'), api('/config')])
        setParams(pr.parameters || [])
        setConfig(cf.config || {})
        setWebhook(cf.webhook_url || '')
        setCfgData(cf || {})
      }
    } catch (e) {
      setMe(null)
    }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const err = sp.get('error')
    const reason = sp.get('reason')
    if (err) toast.error('Erreur de connexion: ' + err + (reason ? ' — ' + decodeURIComponent(reason) : ''), { duration: 8000 })
    if (err) window.history.replaceState({}, '', '/')
    loadAll()
  }, [])

  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setMe(null) }

  if (me === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background grid-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow animate-pulse"><Shield className="w-6 h-6 text-primary" /></div>
          <p className="text-muted-foreground text-sm">Chargement d'Obsidian...</p>
        </div>
      </div>
    )
  }

  if (!me) return <Landing />
  if (me.status !== 'active' && !me.is_admin) return <Pending me={me} onLogout={logout} />

  return (
    <Dashboard
      me={me}
      params={params}
      config={config}
      webhook={webhook}
      cfgData={cfgData}
      reloadAll={loadAll}
      onLogout={logout}
      onKey={(k) => setMe((m) => ({ ...m, api_key: k }))}
    />
  )
}
