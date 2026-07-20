'use client';
import { useEffect } from 'react';
export function QrTracker({ source }: { source: 'carte'|'votre_rue' }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: `qr_scan_${source}`, source } }));
  }, [source]);
  return null;
}
