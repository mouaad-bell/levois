'use client';

import { useEffect } from 'react';

type LevoisEvent = { name: string; source?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    levoisEventQueue?: LevoisEvent[];
  }
}

function publish(detail: LevoisEvent) {
  if (!detail.name) return;
  window.levoisEventQueue ??= [];
  window.levoisEventQueue.push(detail);
  window.dataLayer ??= [];
  window.dataLayer.push({ event: detail.name, source: detail.source });
  if (typeof window.gtag === 'function') {
    window.gtag('event', detail.name, { source: detail.source });
  }
}

export function AnalyticsBridge() {
  useEffect(() => {
    const eventHandler = (event: Event) => {
      const detail = (event as CustomEvent<LevoisEvent>).detail;
      if (detail?.name) publish(detail);
    };

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const tracked = target?.closest<HTMLElement>('[data-event]');
      if (!tracked) return;
      const name = tracked.dataset.event;
      if (!name) return;
      publish({ name, source: tracked.dataset.source });
    };

    window.addEventListener('levois:event', eventHandler);
    document.addEventListener('click', clickHandler);
    return () => {
      window.removeEventListener('levois:event', eventHandler);
      document.removeEventListener('click', clickHandler);
    };
  }, []);

  return null;
}
