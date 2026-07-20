'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const questions = [
  { q: 'Votre projet est-il déjà clairement défini ?', pillar: 'Comprendre' },
  { q: 'Votre calendrier, votre prix attendu et votre niveau de risque sont-ils compatibles ?', pillar: 'Aligner' },
  { q: 'Savez-vous à quels acheteurs votre bien peut réellement correspondre ?', pillar: 'Positionner' },
  { q: 'Analysez-vous séparément les demandes, visites, objections et délais ?', pillar: 'Piloter' },
  { q: 'Chaque retour reçu conduit-il à une décision précise ?', pillar: 'Apprendre' },
];

export function Diagnostic() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const started = useRef(false);
  const completed = useRef(false);
  const complete = Object.keys(answers).length === questions.length;
  const weakest = useMemo(() => {
    if (!complete) return null;
    const index = questions.reduce((minimum, _, i) => (answers[i] ?? 0) < (answers[minimum] ?? 0) ? i : minimum, 0);
    return questions[index].pillar;
  }, [answers, complete]);

  function answer(index: number, value: number) {
    if (!started.current) {
      started.current = true;
      window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: 'diagnostic_started', source: 'diagnostic' } }));
    }
    const next = { ...answers, [index]: value };
    setAnswers(next);
    if (!completed.current && Object.keys(next).length === questions.length) {
      completed.current = true;
      window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: 'diagnostic_completed', source: 'diagnostic' } }));
    }
  }

  return (
    <div className="diagnostic-card">
      {questions.map((item, index) => (
        <fieldset key={item.pillar} className="question">
          <legend><span>{String(index + 1).padStart(2, '0')}</span>{item.q}</legend>
          <div className="answer-row">
            {['Pas encore', 'En partie', 'Oui, clairement'].map((label, value) => (
              <button key={label} type="button" aria-pressed={answers[index] === value} className={answers[index] === value ? 'answer active' : 'answer'} onClick={() => answer(index, value)}>{label}</button>
            ))}
          </div>
        </fieldset>
      ))}
      {complete && weakest && (
        <div className="diagnostic-result" aria-live="polite">
          <p className="eyebrow">Première orientation</p>
          <h2>Votre prochain point d’attention semble être : {weakest}.</h2>
          <p>Ce résultat ne remplace pas une analyse de votre bien. Il indique simplement l’endroit où une clarification peut rendre les prochaines décisions plus cohérentes.</p>
          <div className="button-row"><Link className="button" href="/contact/" data-event="contact_started" data-source="diagnostic_result">Demander un regard humain</Link><Link className="button button-secondary" href="/methode/">Comprendre la méthode</Link></div>
        </div>
      )}
    </div>
  );
}
