// ═══════════════════════════════════════════════════════════
// Install Prompt — Custom PWA install UI
//
// Listens for the `beforeinstallprompt` event and shows a
// branded install button instead of the browser default.
//
// iOS Safari doesn't fire this event — we show manual instructions
// via detecting standalone mode + platform.
// ═══════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/.test(ua));

    // Detect if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if previously dismissed
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setDismissed(true);
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-[55]
      bg-gradient-to-br from-pp-maroon to-pp-navy-deep border border-pp-gold/30 rounded-xl p-4 shadow-modal">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-pp-text-muted hover:text-pp-text text-lg w-6 h-6
          flex items-center justify-center rounded-full hover:bg-pp-bg-surface/30"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-lg bg-pp-gold/20 border border-pp-gold/30 flex items-center justify-center flex-shrink-0 text-xl">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-pp-gold">Instalar ProPanas</div>
          <div className="text-xs text-pp-text-secondary mt-1 leading-relaxed">
            {isIOS
              ? 'Toca el botón Compartir y luego "Añadir a pantalla de inicio".'
              : 'Instala la app para acceso rápido y funciones offline.'}
          </div>

          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-3 bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
                px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all"
            >
              Instalar app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

