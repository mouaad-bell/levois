'use client';

import { useState } from 'react';

import styles from './answerShareActions.module.css';

type CopyKind = 'link' | 'citation' | 'backlink';

export function AnswerShareActions({
  title,
  description,
  canonicalUrl,
  author,
  modifiedDate,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  author: string;
  modifiedDate: string;
}) {
  const [copied, setCopied] = useState<CopyKind | null>(
    null,
  );
  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(title);
  const citation = `${author}, « ${title} », LEVOIS, mis à jour le ${modifiedDate}, ${canonicalUrl}`;
  const backlink = `<a href="${canonicalUrl}">${title} — LEVOIS</a>`;

  async function copy(value: string, kind: CopyKind) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title,
        text: description,
        url: canonicalUrl,
      });
      return;
    }

    await copy(canonicalUrl, 'link');
  }

  return (
    <section
      className={styles.share}
      aria-labelledby="share-title"
    >
      <div>
        <p className={styles.eyebrow}>Partager</p>
        <h2 id="share-title">
          Faire circuler cette réponse
        </h2>
        <p>
          L’URL est permanente. La citation et le lien
          HTML facilitent aussi une reprise propre sur un
          autre site.
        </p>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={share}>
          Partager l’article
        </button>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => copy(canonicalUrl, 'link')}
        >
          {copied === 'link' ? 'Lien copié' : 'Copier le lien'}
        </button>
        <button
          type="button"
          onClick={() => copy(citation, 'citation')}
        >
          {copied === 'citation'
            ? 'Citation copiée'
            : 'Copier la citation'}
        </button>
        <button
          type="button"
          onClick={() => copy(backlink, 'backlink')}
        >
          {copied === 'backlink'
            ? 'Lien HTML copié'
            : 'Copier le lien HTML'}
        </button>
      </div>
    </section>
  );
}

