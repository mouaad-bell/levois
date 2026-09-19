'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildStudioProject, STUDIO_FIXTURES } from '@/lib/studio-engine';
import { buildStudioProjectFromResearch, type ResearchApiResponse } from '@/lib/studio-research';
import { buildStudioProjectFromEditorial, type EditorialApiResponse } from '@/lib/studio-editorial';
import type { StudioProject } from '@/lib/studio-schema';
import { reviewCanon } from '@/lib/canon-review';
import { buildPublicationPackage } from '@/lib/publication-package';
import { CarouselFrame } from '@/components/render/CarouselFrame';
import styles from '@/app/studio/studio.module.css';

type Tab = 'scope' | 'evidence' | 'canon' | 'angles' | 'article' | 'storyboard' | 'publication' | 'reviews' | 'json';

const tabs: Array<[Tab, string]> = [
  ['scope', 'Scope'],
  ['evidence', 'Evidence'],
  ['canon', 'Canon'],
  ['angles', 'Angles'],
  ['article', 'Article'],
  ['storyboard', 'Storyboard'],
  ['publication', 'Publication'],
  ['reviews', 'Revue'],
  ['json', 'JSON'],
];

type LibraryCoveragePreview = {
  hits: number;
  direct: number;
  historical: number;
  refreshRequired: number;
  propertyCheck: number;
  personCheck: number;
  freshDirect: number;
  primaryDirect: number;
  strongDirect: number;
  topDirectScore: number;
  uniqueTopics: number;
  candidateForWebSkip: boolean;
  retrievalIntent?: string;
};

const SESSION_KEY = 'levois_studio_access_key';

export function Studio() {
  const [input, setInput] = useState<string>(STUDIO_FIXTURES[0]);
  const [project, setProject] = useState<StudioProject>(() => buildStudioProject(STUDIO_FIXTURES[0]));
  const [tab, setTab] = useState<Tab>('scope');
  const [error, setError] = useState('');
  const [studioKey, setStudioKey] = useState('');
  const [researching, setResearching] = useState(false);
  const [libraryTesting, setLibraryTesting] = useState(false);
  const [editorialBuilding, setEditorialBuilding] = useState(false);
  const [editorialMeta, setEditorialMeta] = useState<EditorialApiResponse['meta'] | null>(null);
  const [libraryCoverage, setLibraryCoverage] = useState<LibraryCoveragePreview | null>(null);
  const [researchMeta, setResearchMeta] = useState<ResearchApiResponse['meta'] | null>(null);

  useEffect(() => {
    try {
      setStudioKey(sessionStorage.getItem(SESSION_KEY) ?? '');
    } catch {}
  }, []);

  const familyStyle = useMemo(
    () => ({ '--studio-accent': project.family.accent } as React.CSSProperties),
    [project.family.accent],
  );

  function updateStudioKey(value: string) {
    setStudioKey(value);
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, value);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function runLocal() {
    try {
      setProject(buildStudioProject(input));
      setResearchMeta(null);
      setEditorialMeta(null);
      setLibraryCoverage(null);
      setTab('scope');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de construire le projet.');
    }
  }

  async function runLibrarySearch() {
    if (!studioKey.trim()) {
      setError('Ajoutez la clé Studio privée pour tester la bibliothèque.');
      return;
    }

    setLibraryTesting(true);
    setError('');

    try {
      const response = await fetch('/api/studio/library/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ input, limit: 24 }),
      });

      const payload = await response.json() as {
        coverage?: LibraryCoveragePreview;
        error?: string;
      };

      if (!response.ok || !payload.coverage) {
        throw new Error(payload.error || 'La bibliothèque n’a pas répondu.');
      }

      setLibraryCoverage(payload.coverage);
      setTab('evidence');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Le test bibliothèque a échoué.',
      );
    } finally {
      setLibraryTesting(false);
    }
  }

  async function runEditorial(force = false) {
    if (!studioKey.trim()) {
      setError('Ajoutez la clé Studio privée pour construire depuis la bibliothèque.');
      return;
    }

    setEditorialBuilding(true);
    setError('');

    try {
      const response = await fetch('/api/studio/editorial', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ input, force }),
      });

      const payload = await response.json() as Partial<EditorialApiResponse> & {
        error?: string;
      };

      if (!response.ok || !payload.bundle || !payload.evidencePack || !payload.meta) {
        throw new Error(
          payload.error ||
            'La bibliothèque ne permet pas encore de construire ce contenu sans complément.',
        );
      }

      setProject(
        buildStudioProjectFromEditorial(
          input,
          payload.evidencePack,
          payload.bundle,
        ),
      );
      setEditorialMeta(payload.meta);
      setResearchMeta(null);
      setTab('canon');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'La construction éditoriale a échoué.',
      );
    } finally {
      setEditorialBuilding(false);
    }
  }

  async function runResearch() {
    if (!studioKey.trim()) {
      setError('Ajoutez la clé Studio privée pour lancer la recherche.');
      return;
    }

    setResearching(true);
    setEditorialMeta(null);
    setError('');

    try {
      const response = await fetch('/api/studio/research', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ input }),
      });

      const payload = await response.json() as Partial<ResearchApiResponse> & { error?: string };
      if (!response.ok || !payload.bundle || !payload.meta) {
        throw new Error(payload.error || 'La recherche n’a pas produit de dossier exploitable.');
      }

      setProject(buildStudioProjectFromResearch(input, payload.bundle));
      setResearchMeta(payload.meta);
      setTab('evidence');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La recherche a échoué.');
    } finally {
      setResearching(false);
    }
  }

  return (
    <div className={styles.shell} style={familyStyle}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.brand}>LEVOIS / STUDIO</p>
          <p className={styles.statusLine}>
            Canon Contenu V1 · Evidence V2.1 · aucun chiffre inventé
            {researchMeta ? ` · ${researchMeta.model}` : ''}
          </p>
        </div>
        <div className={styles.topbarActions}>
          <a className={styles.renderLink} href="/studio/render/">Aperçu rendu</a>
          <div className={styles.familyBadge}>
            <span>{project.family.code}</span>
            <strong>{project.family.label}</strong>
          </div>
        </div>
      </header>

      <section className={styles.composer}>
        <div className={styles.composerCopy}>
          <p className={styles.kicker}>Matière de départ</p>
          <h1>De quoi voulez-vous parler ?</h1>
          <p>
            Donnez une idée, une question ou une URL. Le Studio commence par la bibliothèque LEVOIS, distingue faits et inconnues,
            puis construit l’angle, l’article et le storyboard. Le web n’est appelé que si une preuve nécessaire manque ou doit être rafraîchie.
          </p>
        </div>

        <div className={styles.inputPanel}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Idée, question ou URL"
            rows={5}
          />

          <div className={styles.fixtureRow}>
            {STUDIO_FIXTURES.map((fixture) => (
              <button key={fixture} type="button" onClick={() => setInput(fixture)}>
                {fixture}
              </button>
            ))}
          </div>

          <div className={styles.accessRow}>
            <label>
              <span>Clé Studio privée</span>
              <input
                type="password"
                value={studioKey}
                onChange={(event) => updateStudioKey(event.target.value)}
                autoComplete="off"
                placeholder="Session uniquement"
              />
            </label>
            <p>La clé OpenAI reste côté serveur. Cette clé d’accès ne quitte pas votre requête vers LEVOIS.</p>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={runLocal}
              disabled={researching || libraryTesting || editorialBuilding}
            >
              Structure seule
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={runLibrarySearch}
              disabled={researching || libraryTesting || editorialBuilding}
            >
              {libraryTesting ? 'Bibliothèque…' : 'Tester bibliothèque'}
            </button>
            <button
              className={styles.runButton}
              type="button"
              onClick={() => runEditorial(false)}
              disabled={researching || libraryTesting || editorialBuilding}
            >
              {editorialBuilding ? 'Construction…' : 'Construire depuis V2.1'}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => runEditorial(true)}
              disabled={researching || libraryTesting || editorialBuilding}
              title="Ignore le cache éditorial pour produire une nouvelle version avec le même Evidence Pack."
            >
              Régénérer
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={runResearch}
              disabled={researching || libraryTesting || editorialBuilding}
            >
              {researching ? 'Recherche web…' : 'Compléter par le web'}
            </button>
          </div>

          {libraryCoverage ? (
            <p className={styles.researchMeta}>
              Bibliothèque{libraryCoverage.retrievalIntent ? ' · ' + libraryCoverage.retrievalIntent : ''} : {libraryCoverage.hits} résultat(s) · {libraryCoverage.direct} direct(s) ·{' '}
              {libraryCoverage.strongDirect} fort(s) · {libraryCoverage.historical} historique(s) · {libraryCoverage.refreshRequired} à rafraîchir ·{' '}
              {libraryCoverage.candidateForWebSkip ? 'couverture suffisante pour tenter sans web' : 'complément potentiellement nécessaire'}
            </p>
          ) : null}
          {editorialMeta ? (
            <p className={styles.researchMeta}>
              V2.1{editorialMeta.retrievalIntent ? ' · ' + editorialMeta.retrievalIntent : ''} → {editorialMeta.libraryHits} preuve(s) récupérée(s) ·{' '}
              {editorialMeta.directEvidence} directe(s) ·{' '}
              {editorialMeta.conditionalEvidence} conditionnelle(s) · web non utilisé ·{' '}
              {editorialMeta.model}
              {editorialMeta.cacheHit ? ' · cache éditorial réutilisé' : ''}
              {editorialMeta.traceabilityLogged ? ' · trace D1 enregistrée' : ''}
            </p>
          ) : null}
          {researchMeta ? (
            <p className={styles.researchMeta}>
              {researchMeta.retrievalIntent ? researchMeta.retrievalIntent + ' · ' : ''}
              {researchMeta.libraryHits ?? 0} preuve(s) bibliothèque ·{' '}
              {researchMeta.webSkipped
                ? 'web évité'
                : `${researchMeta.searchedSources} source(s) web observée(s)`} ·{' '}
              {researchMeta.acceptedSources} source(s) retenue(s) ·{' '}
              {researchMeta.downgradedClaims} claim(s) déclassé(s)
              {researchMeta.traceabilityLogged ? ' · trace D1 enregistrée' : ''}
            </p>
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      </section>

      <section className={styles.summary}>
        <SummaryCard label="Statut" value={project.status === 'storyboard_ready' ? 'Storyboard prêt' : 'Recherche requise'} />
        <SummaryCard label="Sources retenues" value={String(project.evidencePack.sources.length)} />
        <SummaryCard label="Claims vérifiés" value={String(project.evidencePack.summary.verifiedClaims)} />
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
        {tab === 'canon' ? <CanonView project={project} /> : null}
        {tab === 'angles' ? <AnglesView project={project} /> : null}
        {tab === 'article' ? <ArticleView project={project} /> : null}
        {tab === 'storyboard' ? <StoryboardView project={project} /> : null}
        {tab === 'publication' ? <PublicationView project={project} studioKey={studioKey} /> : null}
        {tab === 'reviews' ? <ReviewQueueView studioKey={studioKey} /> : null}
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
          <h2>{pack.summary.canPublish ? 'Angle soutenable' : 'Publication bloquée avant preuve suffisante'}</h2>
        </div>
        <span data-ready={pack.summary.canPublish ? 'true' : 'false'}>
          {pack.summary.canPublish ? 'CAN PUBLISH' : 'RESEARCH REQUIRED'}
        </span>
      </section>

      {pack.claims.length ? (
        <div className={styles.claimGrid}>
          {pack.claims.map((claim) => (
            <article className={styles.claimCard} key={claim.claimId}>
              <div className={styles.claimMeta}>
                <span>{claim.claimId}</span>
                <b>{claim.status}</b>
              </div>
              {claim.evidenceUseClass || claim.publicationReadiness ? (
                <p className={styles.evidenceClass}>
                  {claim.evidenceUseClass ?? 'WEB'}
                  {claim.publicationReadiness ? ' · ' + claim.publicationReadiness : ''}
                  {claim.verificationRequiredBeforePublication ? ' · REVUE AVANT PUBLICATION' : ''}
                </p>
              ) : null}
              <h3>{claim.value !== undefined ? `${String(claim.value).replace('.', ',')}${claim.unit ? ' ' + claim.unit : ''}` : claim.claim}</h3>
              <p>{claim.claim}</p>
              {claim.allowedUses.length ? (
                <div className={styles.claimAllowed}>
                  <strong>Permet de dire :</strong>
                  <ul>{claim.allowedUses.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ) : null}
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
          <p className={styles.cardIndex}>Sources réellement retenues</p>
          {pack.sources.map((source) => (
            <div className={styles.sourceRow} key={source.sourceId}>
              <span>{source.sourceId}</span>
              <div>
                <strong>{source.publisher}</strong>
                <p>{source.title}{source.dataPeriod ? ` · ${source.dataPeriod}` : ''}</p>
              </div>
              {source.url ? <a href={source.url} target="_blank" rel="noreferrer">Ouvrir ↗</a> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className={styles.card}>
        <p className={styles.cardIndex}>Inconnues / limites</p>
        {pack.unknowns.length ? pack.unknowns.map((unknown) => (
          <div className={styles.unknownRow} key={unknown.unknownId}>
            <span>{unknown.blocking ? 'BLOQUANT' : 'À GARDER EN TÊTE'}</span>
            <div><strong>{unknown.question}</strong><p>{unknown.reason}</p></div>
          </div>
        )) : <p>Aucune inconnue déclarée par le dossier.</p>}
        {pack.summary.limitations.map((item) => <p key={item} className={styles.limitText}>→ {item}</p>)}
      </section>
    </div>
  );
}


function CanonView({ project }: { project: StudioProject }) {
  const canon = project.canon;
  const review = reviewCanon(project);

  if (!canon) {
    return (
      <section className={styles.emptyState}>
        <strong>Canon non calculé.</strong>
        <p>
          La structure locale reste disponible, mais le dossier n’est pas prêt pour une production canonique tant que la recherche n’a pas produit la fiche décision, les trois ouvertures et les six fonctions du récit.
        </p>
      </section>
    );
  }

  const selectedHook = canon.hookCandidates.find(
    (candidate) => candidate.mode === canon.selectedHookMode,
  );

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <p className={styles.cardIndex}>Canon · {canon.canonVersion}</p>
        <h2>{canon.decisionFrame.decision}</h2>
        <dl className={styles.definitionList}>
          <div><dt>Personne</dt><dd>{canon.decisionFrame.person}</dd></div>
          <div><dt>Lecture spontanée</dt><dd>{canon.decisionFrame.spontaneousReading}</dd></div>
          <div><dt>Mise à l’épreuve</dt><dd>{canon.decisionFrame.pressureTest}</dd></div>
          <div><dt>Conclusion autorisée</dt><dd>{canon.decisionFrame.authorizedConclusion}</dd></div>
          <div><dt>Opération finale</dt><dd>{canon.decisionFrame.finalOperation}</dd></div>
        </dl>
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Trois ouvertures</p>
        {canon.hookCandidates.map((candidate) => (
          <div className={styles.sourceRow} key={candidate.mode}>
            <span>{candidate.mode.toUpperCase()}</span>
            <div>
              <strong>{candidate.text}</strong>
              <p>{candidate.explicitPromise}</p>
              <small>
                {candidate.family}
                {candidate.mode === canon.selectedHookMode ? ' · RETENU' : ''}
              </small>
            </div>
          </div>
        ))}
        {selectedHook ? (
          <p className={styles.limitText}>
            → Hook retenu : {selectedHook.text}
          </p>
        ) : null}
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Progression canonique</p>
        {canon.storyBeats.map((beat, index) => (
          <div className={styles.unknownRow} key={beat.function}>
            <span>{String(index + 1).padStart(2, '0')} · {beat.function}</span>
            <div>
              <strong>{beat.copy}</strong>
              <p>Avant : {beat.before}</p>
              <p>Après : {beat.after}</p>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Résolution</p>
        <h3>Limite essentielle</h3>
        <p>{canon.essentialLimit}</p>
        <h3>Action autonome</h3>
        <p>{canon.autonomousAction}</p>
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Contrôle avant diffusion</p>
        <h2>{review.ready ? 'Prêt éditorialement' : 'À reprendre avant diffusion'}</h2>
        {review.items.map((entry) => (
          <div className={styles.unknownRow} key={entry.id}>
            <span>{entry.status.toUpperCase()}</span>
            <div>
              <strong>{entry.question}</strong>
              <p>{entry.note}</p>
              {entry.status !== 'pass' ? <small>Correction : {entry.correction}</small> : null}
            </div>
          </div>
        ))}
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
            {angle.claimRefs?.length ? <div><dt>Claims centraux</dt><dd>{angle.claimRefs.join(', ')}</dd></div> : null}
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

function PublicationView({
  project,
  studioKey,
}: {
  project: StudioProject;
  studioKey: string;
}) {
  const publication = buildPublicationPackage(project);
  const renderPackage = publication.render.package;
  const renderReview = publication.render.review;
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [staleChecking, setStaleChecking] = useState(false);
  const [staleMessage, setStaleMessage] = useState('');
  const [queueSyncing, setQueueSyncing] = useState(false);
  const [queueMessage, setQueueMessage] = useState('');

  async function copyPublicationPackage() {
    const payload = JSON.stringify(publication, null, 2);
    await navigator.clipboard?.writeText(payload);
    setSaveMessage('Publication Package copié.');
  }

  function downloadPublicationPackage() {
    const payload = JSON.stringify(publication, null, 2);
    const blob = new Blob([payload], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      'levois-publication-' +
      project.projectId +
      '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function saveTraceability() {
    if (!studioKey.trim()) {
      setSaveMessage('Ajoutez la clé Studio privée avant d’enregistrer la trace.');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const items = [
        {
          manifest: publication.traceability.article,
          slug: publication.article.slug,
          status: 'DRAFT_REVIEWED',
          notes: 'Trace article enregistrée depuis le Publication Package V1.',
        },
        {
          manifest: publication.traceability.carousel,
          status: 'DRAFT_REVIEWED',
          notes: 'Trace carrousel enregistrée depuis le Publication Package V1.',
        },
      ];

      for (const item of items) {
        const response = await fetch('/api/studio/traceability/save', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-studio-key': studioKey.trim(),
          },
          body: JSON.stringify(item),
        });

        const payload = await response.json() as {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ||
              'Impossible d’enregistrer la traçabilité.',
          );
        }
      }

      setSaveMessage('Traces article + carrousel enregistrées dans D1.');
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : 'Enregistrement de la traçabilité impossible.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function syncReviewQueue() {
    if (!studioKey.trim()) {
      setQueueMessage('Ajoutez la clé Studio privée avant de synchroniser la file de revue.');
      return;
    }

    setQueueSyncing(true);
    setQueueMessage('');

    try {
      const response = await fetch('/api/studio/traceability/sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ limit: 500 }),
      });

      const payload = await response.json() as {
        queuedArtifacts?: number;
        staleDependencies?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Impossible de synchroniser la file de revue.',
        );
      }

      setQueueMessage(
        (payload.queuedArtifacts ?? 0) +
          ' contenu(s) en revue · ' +
          (payload.staleDependencies ?? 0) +
          ' dépendance(s) détectée(s).',
      );
    } catch (error) {
      setQueueMessage(
        error instanceof Error
          ? error.message
          : 'Synchronisation de la file de revue impossible.',
      );
    } finally {
      setQueueSyncing(false);
    }
  }

  async function checkStaleDependencies() {
    if (!studioKey.trim()) {
      setStaleMessage('Ajoutez la clé Studio privée avant de vérifier les dépendances.');
      return;
    }

    setStaleChecking(true);
    setStaleMessage('');

    try {
      const response = await fetch('/api/studio/traceability/stale', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ limit: 500 }),
      });

      const payload = await response.json() as {
        artifactCount?: number;
        dependencyCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Impossible de vérifier les dépendances.',
        );
      }

      const artifacts = payload.artifactCount ?? 0;
      const dependencies = payload.dependencyCount ?? 0;

      setStaleMessage(
        artifacts === 0
          ? 'Aucun contenu enregistré ne dépend d’une preuve modifiée.'
          : artifacts +
              ' contenu(s) à revoir · ' +
              dependencies +
              ' dépendance(s) modifiée(s).',
      );
    } catch (error) {
      setStaleMessage(
        error instanceof Error
          ? error.message
          : 'Vérification des dépendances impossible.',
      );
    } finally {
      setStaleChecking(false);
    }
  }

  return (
    <div className={styles.stack}>
      <section className={styles.evidenceHeader}>
        <div>
          <p className={styles.kicker}>Publication Package V1</p>
          <h2>{publication.status.replaceAll('_', ' ')}</h2>
        </div>
        <div className={styles.publicationHeaderActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={copyPublicationPackage}
          >
            Copier le package
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={downloadPublicationPackage}
          >
            Télécharger JSON
          </button>
          <span data-ready={publication.status === 'ready_for_human_approval' ? 'true' : 'false'}>
            {publication.status === 'ready_for_human_approval' ? 'HUMAN APPROVAL' : 'NOT READY'}
          </span>
        </div>
      </section>

      {publication.blockers.length ? (
        <section className={styles.card}>
          <p className={styles.cardIndex}>Bloqueurs</p>
          <ul>{publication.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      {publication.warnings.length ? (
        <section className={styles.card}>
          <p className={styles.cardIndex}>Points de revue</p>
          <ul>{publication.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      <section className={styles.twoColumns}>
        <article className={styles.card}>
          <p className={styles.cardIndex}>Answers</p>
          <h3>{publication.article.title}</h3>
          <p>{publication.article.answerShort}</p>
          <dl className={styles.definitionList}>
            <div><dt>Slug</dt><dd>{publication.article.slug}</dd></div>
            <div><dt>Scope</dt><dd>{publication.article.targetScope}</dd></div>
            <div><dt>Evidence</dt><dd>{publication.article.evidenceRefs.join(', ') || '—'}</dd></div>
          </dl>
        </article>

        <article className={styles.card}>
          <p className={styles.cardIndex}>Carrousel</p>
          <h3>{publication.carousel.readerTakeaway}</h3>
          <p>{publication.carousel.centralIdea}</p>
          <dl className={styles.definitionList}>
            <div><dt>Slides</dt><dd>{String(publication.carousel.slides.length)}</dd></div>
            <div><dt>Canon</dt><dd>{publication.carousel.canonReview.ready ? 'PASS' : 'REVIEW'}</dd></div>
            <div><dt>CTA</dt><dd>{publication.carousel.ctaLabel ?? 'désactivé'}</dd></div>
          </dl>
        </article>
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Aperçu structurel 4:5</p>
        <div className={styles.renderPreview}>
          <CarouselFrame
            slide={renderPackage.slides[
              Math.min(
                previewSlideIndex,
                Math.max(renderPackage.slides.length - 1, 0),
              )
            ]}
            packageData={renderPackage}
          />
        </div>
        <div className={styles.previewNav}>
          {renderPackage.slides.map((slide, index) => (
            <button
              type="button"
              key={slide.slideNumber}
              data-active={index === previewSlideIndex ? 'true' : 'false'}
              onClick={() => setPreviewSlideIndex(index)}
            >
              {String(slide.slideNumber).padStart(2, '0')}
            </button>
          ))}
        </div>
        <p className={styles.limitText}>
          {renderReview.ready
            ? 'Structure compatible avec le renderer.'
            : renderReview.issues.length +
              ' point(s) de rendu à traiter, notamment les assets encore manquants.'}
        </p>
        <dl className={styles.definitionList}>
          <div>
            <dt>Assets à produire</dt>
            <dd>{String(publication.render.assetPlan.summary.todo)}</dd>
          </div>
          <div>
            <dt>Source réelle requise</dt>
            <dd>{String(publication.render.assetPlan.summary.realSourceRequired)}</dd>
          </div>
          <div>
            <dt>Programmatique</dt>
            <dd>{String(publication.render.assetPlan.summary.programmatic)}</dd>
          </div>
          <div>
            <dt>Génération explicative autorisée</dt>
            <dd>{String(publication.render.assetPlan.summary.generatedAllowed)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card}>
        <p className={styles.cardIndex}>Traçabilité</p>
        <p>
          Article : {publication.traceability.article.dependencies.length} dépendance(s) preuve ·
          Carrousel : {publication.traceability.carousel.dependencies.length} dépendance(s) preuve.
        </p>
        <p className={styles.limitText}>
          Une modification d’un evidence_id peut déclencher une revue ciblée avant republication.
        </p>
        <div className={styles.actionRow}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={saveTraceability}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer la trace D1'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={checkStaleDependencies}
            disabled={staleChecking}
          >
            {staleChecking ? 'Vérification…' : 'Vérifier les preuves modifiées'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={syncReviewQueue}
            disabled={queueSyncing}
          >
            {queueSyncing ? 'Synchronisation…' : 'Créer la file de revue'}
          </button>
        </div>
        {saveMessage ? (
          <p className={styles.researchMeta}>{saveMessage}</p>
        ) : null}
        {staleMessage ? (
          <p className={styles.researchMeta}>{staleMessage}</p>
        ) : null}
        {queueMessage ? (
          <p className={styles.researchMeta}>{queueMessage}</p>
        ) : null}
      </section>
    </div>
  );
}

type ReviewQueueItem = {
  review_id: string;
  artifact_id: string;
  evidence_id: string | null;
  trigger_type: string;
  reason: string;
  severity: string;
  status: string;
  detected_at: string;
  artifact_type: string;
  title: string;
  slug: string | null;
  route: string | null;
};

function ReviewQueueView({
  studioKey,
}: {
  studioKey: string;
}) {
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  async function loadReviews() {
    if (!studioKey.trim()) {
      setMessage('Ajoutez la clé Studio privée pour lire la file de revue.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/studio/traceability/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ limit: 200 }),
      });

      const payload = await response.json() as {
        reviews?: ReviewQueueItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || 'Impossible de charger la file de revue.',
        );
      }

      setReviews(payload.reviews ?? []);
      setMessage(
        (payload.reviews?.length ?? 0) +
          ' élément(s) ouvert(s).',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Chargement de la file de revue impossible.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function syncReviews() {
    if (!studioKey.trim()) {
      setMessage('Ajoutez la clé Studio privée pour synchroniser la file de revue.');
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      const response = await fetch('/api/studio/traceability/sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-key': studioKey.trim(),
        },
        body: JSON.stringify({ limit: 500 }),
      });

      const payload = await response.json() as {
        queuedArtifacts?: number;
        staleDependencies?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || 'Synchronisation impossible.',
        );
      }

      setMessage(
        (payload.queuedArtifacts ?? 0) +
          ' contenu(s) concernés · ' +
          (payload.staleDependencies ?? 0) +
          ' dépendance(s) modifiée(s).',
      );

      await loadReviews();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Synchronisation impossible.',
      );
    } finally {
      setSyncing(false);
    }
  }

  async function resolveReview(item: ReviewQueueItem) {
    const resolution = window.prompt(
      'Note de résolution pour ' + item.title,
      'Preuve relue et contenu vérifié.',
    );

    if (!resolution?.trim()) return;

    const response = await fetch('/api/studio/traceability/resolve', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-studio-key': studioKey.trim(),
      },
      body: JSON.stringify({
        reviewId: item.review_id,
        resolution: resolution.trim(),
      }),
    });

    const payload = await response.json() as {
      resolved?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.resolved) {
      setMessage(
        payload.error || 'Résolution de la revue impossible.',
      );
      return;
    }

    setReviews((current) =>
      current.filter(
        (review) => review.review_id !== item.review_id,
      ),
    );
    setMessage('Revue clôturée : ' + item.title);
  }

  return (
    <div className={styles.stack}>
      <section className={styles.evidenceHeader}>
        <div>
          <p className={styles.kicker}>Maintenance éditoriale</p>
          <h2>File de revue des preuves</h2>
          <p>
            Une preuve V2.1 modifiée peut rouvrir automatiquement les contenus
            qui en dépendent.
          </p>
        </div>
        <div className={styles.publicationHeaderActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={loadReviews}
            disabled={loading}
          >
            {loading ? 'Chargement…' : 'Charger'}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={syncReviews}
            disabled={syncing}
          >
            {syncing ? 'Synchronisation…' : 'Synchroniser V2.1'}
          </button>
        </div>
      </section>

      {message ? (
        <p className={styles.researchMeta}>{message}</p>
      ) : null}

      {!reviews.length ? (
        <section className={styles.emptyState}>
          <strong>Aucune revue ouverte chargée.</strong>
          <p>
            Chargez la file ou synchronisez les dépendances après une mise à jour
            de la bibliothèque.
          </p>
        </section>
      ) : (
        <div className={styles.stack}>
          {reviews.map((item) => (
            <article className={styles.card} key={item.review_id}>
              <div className={styles.reviewTop}>
                <span data-severity={item.severity}>{item.severity}</span>
                <small>{item.artifact_type}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.reason}</p>
              <dl className={styles.definitionList}>
                <div><dt>Evidence</dt><dd>{item.evidence_id ?? '—'}</dd></div>
                <div><dt>Artifact</dt><dd>{item.artifact_id}</dd></div>
                <div><dt>Détecté</dt><dd>{item.detected_at}</dd></div>
              </dl>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => resolveReview(item)}
                >
                  Marquer revu
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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
