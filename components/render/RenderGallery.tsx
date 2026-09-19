'use client';

import { useMemo, useState } from 'react';
import type { CarouselRenderPackage } from '@/lib/carousel-render-contract';
import { CarouselFrame } from './CarouselFrame';
import styles from './renderGallery.module.css';

export type RenderGalleryItem = {
  id: string;
  label: string;
  subtitle: string;
  packageData: CarouselRenderPackage;
};

export function RenderGallery({
  items,
}: {
  items: RenderGalleryItem[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const [slideIndex, setSlideIndex] = useState(0);

  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items],
  );

  const slides = active?.packageData.slides ?? [];
  const current = slides[Math.min(slideIndex, Math.max(slides.length - 1, 0))];

  function selectPilot(id: string) {
    setActiveId(id);
    setSlideIndex(0);
  }

  if (!active || !current) {
    return (
      <div className={styles.empty}>
        Aucun package de rendu disponible.
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.kicker}>Preuve visuelle</p>
          <h1>Renderer LEVOIS</h1>
          <p className={styles.copy}>
            Aperçu déterministe des contrats de rendu. Ce n’est pas encore
            Remotion : l’objectif est de vérifier hiérarchie, densité,
            qualificatifs et continuité avant animation.
          </p>
        </div>

        <div className={styles.pilotList}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.pilotButton}
              data-active={item.id === active.id ? 'true' : 'false'}
              onClick={() => selectPilot(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </div>

        <a className={styles.backLink} href="/studio/">
          ← Retour au Studio
        </a>
      </aside>

      <main className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <p>{active.label}</p>
            <strong>
              Slide {current.slideNumber} / {slides.length}
            </strong>
          </div>

          <div className={styles.pager}>
            <button
              type="button"
              onClick={() =>
                setSlideIndex((index) => Math.max(index - 1, 0))
              }
              disabled={slideIndex === 0}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() =>
                setSlideIndex((index) =>
                  Math.min(index + 1, slides.length - 1),
                )
              }
              disabled={slideIndex >= slides.length - 1}
            >
              →
            </button>
          </div>
        </div>

        <div className={styles.frameWrap}>
          <CarouselFrame
            slide={current}
            packageData={active.packageData}
          />
        </div>

        <div className={styles.strip} aria-label="Slides">
          {slides.map((slide, index) => (
            <button
              key={slide.slideNumber}
              type="button"
              data-active={index === slideIndex ? 'true' : 'false'}
              onClick={() => setSlideIndex(index)}
            >
              {String(slide.slideNumber).padStart(2, '0')}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
