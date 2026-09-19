'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildStudioProject, STUDIO_FIXTURES } from '@/lib/studio-engine';
import { buildStudioProjectFromResearch, type ResearchApiResponse } from '@/lib/studio-research';
import type { StudioProject } from '@/lib/studio-schema';
import { reviewCanon } from '@/lib/canon-review';
import styles from '@/app/studio/studio.module.css';

type Tab = 'scope' | 'evidence' | 'canon' | 'angles' | 'article' | 'storyboard' | 'json';

const tabs: Array<[Tab, string]> = [
  ['scope', 'Scope'],
  ['evidence', 'Evidence'],
  ['canon', 'Canon'],
  ['angles', 'Angles'],
  ['article', 'Article'],
  ['storyboard', 'Storyboard'],
  ['json', 'JSON'],
];

const SESSION_KEY = 'levois_studio_access_key';

export function Studio() {
  const [input, setInput] = useState<string>(STUDIO_FIXTURES[0]);
  const [project, setProject] = useState<StudioProject>(() => buildStudioProject(STUDIO_FIXTURES[0]));
  const [tab, setTab] = useState<Tab>('scope');
  const [error, setError] = useState('');
  const [studioKey, setStudioKey] = useState('');
  const [researching, setResearching] = useState(false);
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
      setTab('scope');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de construire le projet.');
    }
  }

  async function runResearch() {
    if (!studioKey.trim()) {
      setError('Ajoutez la clé Studio privée pour lancer la recherche.');
      return;
    }

    setResearching(true);
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
            <button className={styles.secondaryButton} type="button" onClick={runLocal} disabled={researching}>
              Structure seule
            </button>
            <button className={styles.runButton} type="button" onClick={runResearch} disabled={researching}>
              {researching ? 'Recherche en cours…' : 'Rechercher + construire'}
            </button>
          </div>

          {researchMeta ? (
            <p className={styles.researchMeta}>
              {researchMeta.libraryHits ?? 0} preuve(s) bibliothèque ·{' '}
              {researchMeta.webSkipped
                ? 'web évité'
                : `${researchMeta.searchedSources} source(s) web observée(s)`} ·{' '}
              {researchMeta.acceptedSources} source(s) retenue(s) ·{' '}
              {researchMeta.downgradedClaims} claim(s) déclassé(s)
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
              <div className={styles.claimMeta}><span>{claim.claimId}</span><b>{claim.status}</b></div>
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
