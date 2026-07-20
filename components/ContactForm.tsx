'use client';

import { FormEvent, useRef, useState } from 'react';
import { site } from '@/lib/site';

export function ContactForm({ source = 'contact' }: { source?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const startedAt = useRef(Date.now());

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const honeypot = String(data.get('_gotcha') ?? '');
    if (honeypot) return;

    setStatus('sending');
    data.set('source', source.slice(0, 80));
    data.set('temps_avant_envoi_ms', String(Date.now() - startedAt.current));
    data.set('_subject', `Nouvelle demande LEVOIS — ${source.slice(0, 80)}`);

    try {
      const response = await fetch(site.formspreeEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (!response.ok) throw new Error(`Formspree returned ${response.status}`);
      form.reset();
      startedAt.current = Date.now();
      setStatus('success');
      window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: 'contact_submitted', source } }));
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} onFocus={() => {
      if (status === 'idle') window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: 'contact_started', source } }));
    }}>
      <input type="hidden" name="source" value={source} />
      <div className="form-honeypot" aria-hidden="true">
        <label>Ne pas remplir ce champ<input name="_gotcha" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label>Votre nom<input required name="nom" autoComplete="name" maxLength={120} /></label>
      <label>Votre email<input required type="email" name="email" autoComplete="email" inputMode="email" maxLength={254} /></label>
      <label>Votre téléphone<input name="telephone" autoComplete="tel" inputMode="tel" maxLength={30} /></label>
      <label>Où en êtes-vous ?
        <select name="situation" defaultValue="">
          <option value="" disabled>Choisir une situation</option>
          <option>Je réfléchis à vendre</option>
          <option>Je prépare la mise en vente</option>
          <option>Mon bien est déjà publié</option>
          <option>J’ai peu de demandes</option>
          <option>J’ai des visites mais pas d’offre</option>
          <option>Mon bien est en vente depuis longtemps</option>
          <option>Mon compromis a été annulé</option>
        </select>
      </label>
      <label>Votre message<textarea required name="message" rows={6} minLength={10} maxLength={4000} /></label>
      <label className="consent"><input required type="checkbox" name="consentement" value="oui" /> J’accepte que les informations saisies soient utilisées pour répondre à ma demande.</label>
      <button className="button" disabled={status === 'sending'}>{status === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}</button>
      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && <p className="form-success">Merci. Votre message a bien été envoyé à Mouaad.</p>}
        {status === 'error' && <p className="form-error">L’envoi a échoué. Vous pouvez écrire directement à <a href="mailto:mouaad@levois.fr">mouaad@levois.fr</a>.</p>}
      </div>
    </form>
  );
}
