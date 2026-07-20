'use client';

import { useEffect } from 'react';

export function QrTracker({ source }: { source: 'carte' | 'votre_rue' }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levois:event', {
        detail: { name: `qr_scan_${source}`, source },
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [source]);

  return null;
}
