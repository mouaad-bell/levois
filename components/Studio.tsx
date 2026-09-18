'use client';

import { useMemo, useState } from 'react';
import { buildStudioProject, STUDIO_FIXTURES } from '@/lib/studio-engine';
import type { StudioProject } from '@/lib/studio-schema';
import styles from '@/app/studio/studio.module.css';

type Tab = 'scope' | 'evidence' | 'angles' | 'article' | 'storyboard' | 'json';

const tabs: Array<[Tab, string]> = [
  ['scope', 'Scope'],
  ['evidence', 'Evidence'],
  ['angles', 'Angles'],
  ['article', 'Article'],
  ['storyboard', 'Storyboard'],
  ['json', 'JSON'],
];

export function Studio() {
  const [input, setInput] = useState(STUDIO_FIXTURES[0]);
  const [project, setProject] = useState<StudioProject>(() => buildStudioProject(STUDIO_FIXTURES[0]));
  const [tab, setTab] = useState<Tab>('scope');
  const [error, setError] = useState('');

  const familyStyle = useMemo(
    () => ({ '--studio-accent': project.family.accent } as React.CSSProperties),
    [project.family.accent],
  );

  function run() {
    try {
      setProject(buildStudioProject(input));
      setTab('scope');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de construire le projet.');
    }
  }

  return (
    <div className={styles.shell} style={familyStyle}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.brand}>LEVOIS / STUDIO</p>
          <p className={styles.statusLine}>Core Schema V1 · prototype interne · aucun chiffre inventé</p>
        </div>
        <div className={styles.familyBadge}>
          <span>{project.family.code}</span>
          <strong>{project.family.label}</strong>
        </div>
      </header>

      <section className={styles.composer}>
        <div className={styles.composerCopy}>
          <p className={styles.kicker}>Matière de départ</p>
          <h1>De quoi voulez-vous parler ?</h1>
          <p>
            Le prototype transforme une idée en Scope, Evidence Pack, angles, Article Master et Storyboard.
            Tant qu’une preuve manque, il bloque la publication au lieu de compléter au hasard.
          </p>
        </div>

        <div className={styles.inputPanel}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Idée ou question"
            rows={5}
          />
          <div className={styles.fixtureRow}>
            {STUDIO_FIXTURES.map((fixture) => (
              <button key={fixture} type="button" onClick={() => setInput(fixture)}>
                {fixture}
              </button>
            ))}
          </div>
          <button className={styles.runButton} type="button" onClick={run}>
            Construire le dossier
          </button>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      </section>

      <section className={styles.summary}>
        <SummaryCard label="Statut" value={project.status === 'storyboard_ready' ? 'Storyboard prêt' : 'Recherche requise'} />
        <SummaryCard label="Claims vérifiés" value={String(project.evidencePack.summary.verifiedClaims)} />
        <SummaryCard label="Inconnues" value={String(project.evidencePack.unknowns.length)} />
        <SummaryCard label="Slides" value={String(project.storyboard.slideCount)} />
      </section>

      <nav className={styles.tabs} aria-label="Étapes du dossier">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" data-active={tab === key ? 'true' : 'false'} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <main className={styles.workspace}>
        {tab === 'scope' ? <ScopeView project={project} /> : null}
        {tab === 'evidence' ? <EvidenceView project={project} /> : null}
        {tab === 'angles' ? <AnglesView project={project} /> : null}
        {tab === 'article' ? <ArticleView project={project} /> : null}
        {tab === 'storyboard' ? <StoryboardView project={project} /> : null}
        {tab === 'json' ? <JsonView project={project} /> : null}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ScopeView({ project }: { project: StudioProject }) {
  const scope = project.scope;
  return (
    <div className={styles.twoColumns}>
      <section className={styles.card}>
        <p className={styles.cardIndex}>01 / Question de décision</p>
        <h2>{scope.decisionQuestion}</h2>
        <p>{scope.objective}</p>
        <dl className={styles.definitionList}>
          <div><dt>Territoire</dt><dd>{scope.territory}</dd></div>
          <div><dt>Public</dt><dd>{scope.audience}</dd></div>
        </dl>
      </section>
      <section className={styles.card}>
        <p className={styles.cardIndex}>02 / Discipline</p>
        <h3>À tester</h3>
        <ul>{scope.hypothesesToTest.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Interdit de présupposer</h3>
        <ul>{scope.mustNotAssume.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </div>
  );
}

function EvidenceView({ project }: { project: StudioProject }) {
  const pack = project.evidencePack;
  return (
    <div className={styles.stack}>
      <section className={styles.evidenceHeader}>
        <div>
          <p className={styles.kicker}>Evidence Pack</p>
          <h2>{pack.summary.canPublish ? 'Angle soutenable' : 'Publication bloquée avant recherche'}</h2>
        </div>
        <span data-ready={pack.summary.canPublish ? 'true' : 'false'}>
          {pack.summary.canPublish ? 'CAN PUBLISH' : 'RESEARCH REQUIRED'}
        </span>
      </section>

      {pack.claims.length ? (
        <div className={styles.claimGrid}>
          {pack.claims.map((claim) => (
            <article className={styles.claimCard} key={claim.claimId}>
              <div className={styles.claimMeta}><span>{claim.claimId}</span><b>{claim.status}</b></div>
              <h3>{claim.value !== undefined ? `${String(claim.value).replace('.', ',')}${claim.unit ? ' ' + claim.unit : ''}` : claim.claim}</h3>
              <p>{claim.claim}</p>
              <div className={styles.claimRule}>
                <strong>Ne permet pas de conclure :</strong>
                <ul>{claim.forbiddenInferences.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <strong>Aucun claim factuel validé.</strong>
          <p>Le moteur peut structurer le raisonnement, mais il n’a pas le droit d’inventer la preuve manquante.</p>
        </section>
      )}

      {pack.sources.length ? (
        <section className={styles.card}>
          <p className={styles.cardIndex}>Sources</p>
          {pack.sources.map((source) => (
            <div className={styles.sourceRow} key={source.sourceId}>
              <span>{source.sourceId}</span>
              <div><strong>{source.publisher}</strong><p>{source.title} · {source.dataPeriod}</p></div>
              {source.url ? <a href={source.url} target="_blank" rel="noreferrer">Ouvrir ↗</a> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className={styles.card}>
        <p className={styles.cardIndex}>Inconnues / limites</p>
        {pack.unknowns.map((unknown) => (
          <div className={styles.unknownRow} key={unknown.unknownId}>
            <span>{unknown.blocking ? 'BLOQUANT' : 'À GARDER EN TÊTE'}</span>
            <div><strong>{unknown.question}</strong><p>{unknown.reason}</p></div>
          </div>
        ))}
        {pack.summary.limitations.map((item) => <p key={item} className={styles.limitText}>→ {item}</p>)}
      </section>
    </div>
  );
}

function AnglesView({ project }: { project: StudioProject }) {
  return (
    <div className={styles.angleGrid}>
      {project.angles.map((angle) => (
        <article className={styles.angleCard} key={angle.angleId} data-selected={angle.selected ? 'true' : 'false'}>
          <div className={styles.angleTop}><span>{angle.angleId}</span>{angle.selected ? <b>RETENU</b> : null}</div>
          <h2>{angle.hook}</h2>
          <p>{angle.promise}</p>
          <dl className={styles.angleDetails}>
            <div><dt>Preuve centrale</dt><dd>{angle.centralProof}</dd></div>
            <div><dt>Pourquoi enregistrer</dt><dd>{angle.saveValue}</dd></div>
            <div><dt>Pont personnel</dt><dd>{angle.bridgeQuestion}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function ArticleView({ project }: { project: StudioProject }) {
  const article = project.articleMaster;
  return (
    <article className={styles.article}>
      <p className={styles.kicker}>Article Master</p>
      <h1>{article.workingTitle}</h1>
      <p className={styles.thesis}>{article.centralThesis}</p>
      {article.sections.map((section, index) => (
        <section key={section.sectionId}>
          <span>{String(index + 1).padStart(2, '0')} · {section.type}</span>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
          {section.claimRefs.length ? <small>Claims : {section.claimRefs.join(', ')}</small> : null}
        </section>
      ))}
      <aside className={styles.takeaway}>
        <span>À retenir</span>
        <strong>{article.keyTakeaway}</strong>
        <p>{article.transferablePrinciple}</p>
      </aside>
      <aside className={styles.bridge}>
        <span>Question personnelle suivante</span>
        <strong>{article.nextPersonalQuestion}</strong>
        <p>{article.recommendedLevoisPath.label} · route {article.recommendedLevoisPath.routeStatus}</p>
      </aside>
    </article>
  );
}

function StoryboardView({ project }: { project: StudioProject }) {
  return (
    <div className={styles.storyboard}>
      <div className={styles.gate}>
        {Object.entries(project.storyboard.qualityGate).map(([key, value]) => (
          <span key={key} data-pass={value ? 'true' : 'false'}>{key} {value ? '✓' : '×'}</span>
        ))}
      </div>
      <div className={styles.slideGrid}>
        {project.storyboard.slides.map((slide) => (
          <article className={styles.slideCard} key={slide.slideNumber}>
            <div className={styles.slideTop}>
              <span>{String(slide.slideNumber).padStart(2, '0')}</span>
              <b>{slide.narrativeRole}</b>
            </div>
            <h2>{slide.headline}</h2>
            <p>{slide.body}</p>
            <div className={styles.slideFooter}>
              <span>{slide.layout}</span>
              <span>{slide.readerEffect}</span>
            </div>
            {slide.sourceLabel ? <small>{slide.sourceLabel}</small> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function JsonView({ project }: { project: StudioProject }) {
  const json = JSON.stringify(project, null, 2);
  async function copy() {
    await navigator.clipboard?.writeText(json);
  }
  return (
    <section className={styles.jsonPanel}>
      <div><p className={styles.kicker}>Contrat machine</p><button type="button" onClick={copy}>Copier le JSON</button></div>
      <pre>{json}</pre>
    </section>
  );
}
