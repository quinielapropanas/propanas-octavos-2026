'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPath = useRef((pathname ?? '') + (searchParams?.toString() ?? ''));

  useEffect(() => {
    const currentPath = (pathname ?? '') + (searchParams?.toString() ?? '');

    if (prevPath.current !== currentPath) {
      // Navigation completed — finish the bar
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      prevPath.current = currentPath;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept all clicks on links and buttons to start the bar
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button');
      if (!target) return;

      // Only trigger for internal navigation links
      if (target.tagName === 'A') {
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
      }

      // Only trigger for buttons that look like navigation (inside forms or with onClick)
      if (target.tagName === 'BUTTON') {
        const type = (target as HTMLButtonElement).type;
        if (type === 'submit') {
          // Login form submit — show progress
          startProgress();
          return;
        }
        // Group selector buttons
        if (target.textContent?.match(/^[A-L]$/)) {
          startProgress();
          return;
        }
        return;
      }

      startProgress();
    };

    function startProgress() {
      setVisible(true);
      setProgress(15);

      // Simulate incremental progress
      if (timerRef.current) clearInterval(timerRef.current);
      let current = 15;
      timerRef.current = setInterval(() => {
        current += Math.random() * 12;
        if (current >= 90) {
          current = 90; // Cap at 90% until navigation completes
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setProgress(current);
      }, 200);
    }

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      {/* Background track */}
      <div className="absolute inset-0 bg-pp-bg-surface/50" />
      {/* Progress fill */}
      <div
        className="absolute top-0 left-0 h-full bg-pp-gold transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '400ms',
          boxShadow: '0 0 8px rgba(201, 168, 76, 0.6)',
        }}
      />
      {/* Glow pulse at the tip */}
      {visible && progress < 100 && (
        <div
          className="absolute top-0 h-full w-24 animate-pulse"
          style={{
            left: `${Math.max(0, progress - 5)}%`,
            background: 'linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.4), transparent)',
          }}
        />
      )}
    </div>
  );
}