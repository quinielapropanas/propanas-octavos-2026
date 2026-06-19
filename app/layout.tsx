// ═══════════════════════════════════════════════════════════
// Root Layout — PWA-ready
//
// Changes vs previous version:
//   - Includes <ServiceWorkerRegistration /> for SW lifecycle
//   - Includes <InstallPrompt /> for custom install UI
//   - Adds iOS-specific PWA meta tags
//   - Adds apple-touch-icon links
// ═══════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { ProgressBar } from '@/components/progress-bar';
import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/components/sw-registration';
import { InstallPrompt } from '@/components/install-prompt';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ProPanas 2026 — Quiniela del Mundial',
    template: '%s · ProPanas 2026',
  },
  description: 'La quiniela más completa del Mundial FIFA 2026. Pronostica, compite y gana con tus panas.',
  manifest: '/manifest.json',
  applicationName: 'ProPanas 2026',
  appleWebApp: {
    capable: true,
    title: 'ProPanas',
    statusBarStyle: 'black-translucent',
    startupImage: [
      { url: '/apple-splash-2048-2732.png', media: '(device-width: 1024px) and (device-height: 1366px)' },
      { url: '/apple-splash-1170-2532.png', media: '(device-width: 390px) and (device-height: 844px)' },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'ProPanas 2026',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080C18' },
    { media: '(prefers-color-scheme: light)', color: '#080C18' },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        {/* iOS-specific PWA tags not handled by Next.js metadata */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-pp-bg min-h-screen">
	  <Suspense fallback={null}>
		<ProgressBar />
	  </Suspense>
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}

