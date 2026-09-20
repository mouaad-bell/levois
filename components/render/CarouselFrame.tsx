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

function visibleNumbers(slide: CarouselRenderSlide) {
  const matches = (slide.headline + ' ' + slide.body).match(
    /\d[\d\s]*(?:€|min(?:ute)?s?|h)?/gi,
  );

  return [...new Set((matches ?? []).map((value) => value.trim()))].slice(0, 3);
}

function statusLabel(asset: CarouselVisualAsset) {
  if (asset.status === 'real_documented') return 'SOURCE';
  if (asset.status === 'pedagogical_fiction') return 'CAS FICTIF';
  if (asset.status === 'generated_explanatory') return 'EXPLICATION';
  return 'VISUEL';
}

function PlanVisual() {
  return (
    <div className={styles.planVisual} aria-hidden="true">
      <div className={styles.planRoomA}><span>VIVRE</span></div>
      <div className={styles.planRoomB}><span>DORMIR</span></div>
      <div className={styles.planRoomC}><span>TRAVAILLER</span></div>
      <div className={styles.planConflict}><span>2 usages</span></div>
    </div>
  );
}

function MapVisual() {
  return (
    <div className={styles.mapVisual} aria-hidden="true">
      <span className={styles.mapRingA} />
      <span className={styles.mapRingB} />
      <span className={styles.mapRoadA} />
      <span className={styles.mapRoadB} />
      <span className={styles.mapOrigin}>A</span>
      <span className={styles.mapDestination}>B</span>
    </div>
  );
}

function TimelineVisual({ numbers }: { numbers: string[] }) {
  return (
    <div className={styles.timelineVisual} aria-hidden="true">
      <div className={styles.timelineTrack}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.timelineNumbers}>
        {(numbers.length ? numbers : ['DÉPART', 'MARGE', 'ARRIVÉE']).map(
          (value) => <strong key={value}>{value}</strong>,
        )}
      </div>
    </div>
  );
}

function DataVisual({
  numbers,
  asset,
}: {
  numbers: string[];
  asset: CarouselVisualAsset;
}) {
  return (
    <div className={styles.dataVisual} aria-hidden="true">
      <div className={styles.dataNumbers}>
        {(numbers.length ? numbers : ['FAIT', 'PÉRIMÈTRE']).map(
          (value, index) => (
            <strong key={value} data-index={index}>{value}</strong>
          ),
        )}
      </div>
      <span className={styles.dataCut} />
      <small>{asset.label || asset.kind}</small>
    </div>
  );
}

function AssetVisual({
  asset,
  slide,
}: {
  asset: CarouselVisualAsset;
  slide: CarouselRenderSlide;
}) {
  const numbers = visibleNumbers(slide);

  if (asset.kind === 'plan') return <PlanVisual />;
  if (asset.kind === 'map') return <MapVisual />;
  if (asset.kind === 'timeline') return <TimelineVisual numbers={numbers} />;
  if (asset.kind === 'data' || asset.kind === 'document') {
    return <DataVisual numbers={numbers} asset={asset} />;
  }

  return (
    <div className={styles.objectVisual} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function AssetCard({
  asset,
  slide,
}: {
  asset: CarouselVisualAsset;
  slide: CarouselRenderSlide;
}) {
  return (
    <div
      className={styles.assetCard}
      data-kind={asset.kind}
      data-status={asset.status}
      title={asset.alt}
    >
      <AssetVisual asset={asset} slide={slide} />
      <div className={styles.assetCaption}>
        <span>{asset.label || asset.kind}</span>
        <small>{statusLabel(asset)}</small>
      </div>
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
        <AssetCard key={asset.assetId} asset={asset} slide={slide} />
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
      data-family={slide.familyId}
      data-layout={slide.layout}
      style={
        {
          '--accent': accent,
        } as CSSProperties
      }
    >
      <div className={styles.texture} />

      <header className={styles.brandRow}>
        <span>LEVOIS / DÉCIDER</span>
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
