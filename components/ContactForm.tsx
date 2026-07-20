'use client';
import { FormEvent, useState } from 'react';

const ENDPOINT = 'https://formspree.io/f/xnjynroj';

export function ContactForm({ source = 'contact' }: { source?: string }) {
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error('Formspree error');
      form.reset();
      setStatus('success');
      window.dispatchEvent(new CustomEvent('levois:event', { detail: { name: 'contact_submitted', source } }));
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <input type="hidden" name="source" value={source} />
      <label>Votre nom<input required name="nom" autoComplete="name" /></label>
      <label>Votre email<input required type="email" name="email" autoComplete="email" /></label>
      <label>Votre téléphone<input name="telephone" autoComplete="tel" /></label>
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
      <label>Votre message<textarea required name="message" rows={6} /></label>
      <label className="consent"><input required type="checkbox" name="consentement" value="oui" /> J’accepte que les informations saisies soient utilisées pour répondre à ma demande.</label>
      <button className="button" disabled={status === 'sending'}>{status === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}</button>
      {status === 'success' && <p className="form-success">Merci. Votre message a bien été envoyé à Mouaad.</p>}
      {status === 'error' && <p className="form-error">L’envoi a échoué. Vous pouvez écrire directement à mouaad@levois.fr.</p>}
    </form>
  );
}
