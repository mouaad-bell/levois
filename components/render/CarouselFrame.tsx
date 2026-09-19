import type { CSSProperties } from 'react';
import type {
  CarouselRenderPackage,
  CarouselRenderSlide,
  CarouselVisualAsset,
} from '@/lib/carousel-render-contract';
import { STUDIO_FAMILIES } from '@/lib/studio-schema';
import styles from './carouselFrame.module.css';

function familyAccent(familyId: string) {
  const family =
    STUDIO_FAMILIES[
      familyId as keyof typeof STUDIO_FAMILIES
    ];
  return family?.accent ?? '#00D9F5';
}

function AssetGlyph({
  asset,
}: {
  asset: CarouselVisualAsset;
}) {
  return (
    <div
      className={styles.assetGlyph}
      data-kind={asset.kind}
      data-status={asset.status}
      title={asset.alt}
    >
      <span>{asset.label || asset.kind}</span>
      <small>
        {asset.status === 'real_documented'
          ? 'SOURCE'
          : asset.status === 'pedagogical_fiction'
            ? 'CAS FICTIF'
            : asset.status === 'generated_explanatory'
              ? 'EXPLICATION'
              : 'VISUEL'}
      </small>
    </div>
  );
}

function VisualStage({
  slide,
  assets,
}: {
  slide: CarouselRenderSlide;
  assets: CarouselVisualAsset[];
}) {
  const selected = slide.assetIds
    .map((assetId) =>
      assets.find((asset) => asset.assetId === assetId),
    )
    .filter(
      (asset): asset is CarouselVisualAsset =>
        Boolean(asset),
    );

  if (!selected.length) {
    return (
      <div className={styles.visualEmpty}>
        <span>LEVOIS</span>
      </div>
    );
  }

  return (
    <div
      className={styles.visualStage}
      data-layout={slide.layout}
    >
      {selected.map((asset) => (
        <AssetGlyph key={asset.assetId} asset={asset} />
      ))}
    </div>
  );
}

export function CarouselFrame({
  slide,
  packageData,
}: {
  slide: CarouselRenderSlide;
  packageData: CarouselRenderPackage;
}) {
  const accent = familyAccent(slide.familyId);

  return (
    <article
      className={styles.frame}
      style={
        {
          '--accent': accent,
        } as CSSProperties
      }
    >
      <div className={styles.texture} />

      <header className={styles.brandRow}>
        <span>LEVOIS</span>
        <span>
          {String(slide.slideNumber).padStart(2, '0')}
        </span>
      </header>

      <VisualStage
        slide={slide}
        assets={packageData.assets}
      />

      <div className={styles.copyBlock}>
        {slide.essentialQualifier ? (
          <span className={styles.qualifier}>
            {slide.essentialQualifier}
          </span>
        ) : null}

        <h2>{slide.headline}</h2>

        {slide.body ? <p>{slide.body}</p> : null}

        {slide.sourceLabel ? (
          <small className={styles.source}>
            {slide.sourceLabel}
          </small>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <span>Comprendre pour décider</span>
        <span className={styles.accentDot} />
      </footer>
    </article>
  );
}
