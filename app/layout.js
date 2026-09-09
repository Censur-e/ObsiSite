import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Obsidian — Anticheat Roblox',
  description: 'Configurez votre anticheat Roblox Obsidian a distance. Detections, protection, webhooks Discord et plus.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  )
}
