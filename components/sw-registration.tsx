// ═══════════════════════════════════════════════════════════
// Service Worker Registration — Client component
//
// Features:
//   - Registers /sw.js on mount (production only)
//   - Detects when a new SW is waiting
//   - Shows an update toast with "Actualizar" button
//   - Activates new SW on user click (skipWaiting)
//   - Reloads the page to pick up new version
//
// Import in app/layout.tsx
// ═══════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only register in production (avoids SW caching during dev)
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    let mounted = true;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Always check for SW updates
        });

        if (!mounted) return;
        setRegistration(reg);

        // If there's already a waiting worker, show update immediately
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        // Listen for new workers being installed
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // When new SW is installed and another is controlling → update available
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (mounted) setUpdateAvailable(true);
            }
          });
        });

        // Check for updates periodically (every 30 minutes)
        const intervalId = setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);

        return () => clearInterval(intervalId);
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    register();

    // Reload when a new SW takes control
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    // `controllerchange` listener above will reload
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-[60]
      bg-pp-bg-surface border border-pp-gold/30 rounded-xl p-4 shadow-modal
      flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <span className="text-2xl flex-shrink-0">🔄</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-pp-gold">Nueva versión disponible</div>
        <div className="text-xs text-pp-text-muted mt-0.5">Actualiza para obtener las últimas mejoras</div>
      </div>
      <button
        onClick={handleUpdate}
        className="bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
          px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all flex-shrink-0"
      >
        Actualizar
      </button>
    </div>
  );
}
