'use client';
import { useEffect } from 'react';

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }

export function AnalyticsBridge() {
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{name:string; source?:string}>).detail;
      if (!detail?.name) return;
      if (typeof window.gtag === 'function') window.gtag('event', detail.name, { source: detail.source });
      else console.info('[LEVOIS analytics]', detail);
    };
    window.addEventListener('levois:event', handler);
    return () => window.removeEventListener('levois:event', handler);
  }, []);
  return null;
}
