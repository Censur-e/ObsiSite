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
} from 'lucide-react'

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
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.356-.43.83-.593 1.211a18.27 18.27 0 0 0-4.93 0A12.6 12.6 0 0 0 10.44 3 19.7 19.7 0 0 0 6.68 4.37C2.9 9.9 2.16 15.28 2.5 20.6a19.9 19.9 0 0 0 6.06 3.06c.49-.67.93-1.38 1.3-2.13-.71-.27-1.39-.6-2.03-.99.17-.12.34-.25.5-.38 3.9 1.82 8.12 1.82 11.98 0 .16.13.33.26.5.38-.65.39-1.33.72-2.04.99.37.75.81 1.46 1.3 2.13a19.85 19.85 0 0 0 6.06-3.06c.4-6.16-.7-11.49-3.82-16.23zM9.68 15.33c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.41-2.15 2.41zm4.64 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.94 2.41-2.15 2.41z" />
    </svg>
  )
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
                </TabsList>
                <TabsContent value="users"><AdminUsers /></TabsContent>
                <TabsContent value="params"><AdminParameters params={params} reload={reloadAll} /></TabsContent>
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
