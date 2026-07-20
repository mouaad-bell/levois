'use client';
import { useMemo, useState } from 'react';
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
  const complete = Object.keys(answers).length === questions.length;
  const weakest = useMemo(() => {
    if (!complete) return null;
    const index = questions.reduce((m, _, i) => (answers[i] ?? 0) < (answers[m] ?? 0) ? i : m, 0);
    return questions[index].pillar;
  }, [answers, complete]);

  return (
    <div className="diagnostic-card">
      {questions.map((item, index) => (
        <fieldset key={item.pillar} className="question">
          <legend><span>{String(index + 1).padStart(2,'0')}</span>{item.q}</legend>
          <div className="answer-row">
            {['Pas encore','En partie','Oui, clairement'].map((label, value) => (
              <button key={label} type="button" className={answers[index] === value ? 'answer active' : 'answer'} onClick={() => setAnswers(a => ({...a,[index]:value}))}>{label}</button>
            ))}
          </div>
        </fieldset>
      ))}
      {complete && weakest && (
        <div className="diagnostic-result">
          <p className="eyebrow">Première orientation</p>
          <h2>Votre prochain point d’attention semble être : {weakest}.</h2>
          <p>Ce résultat ne remplace pas une analyse de votre bien. Il indique simplement l’endroit où une clarification peut rendre les prochaines décisions plus cohérentes.</p>
          <div className="button-row"><Link className="button" href="/contact/">Demander un regard humain</Link><Link className="button button-secondary" href="/methode/">Comprendre la méthode</Link></div>
        </div>
      )}
    </div>
  );
}
