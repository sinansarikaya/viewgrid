import React, { useState } from 'react';
import content from '../data/local-analysis.json';
import styles from './LocalAnalysisGuide.module.css';

type Language = keyof typeof content;

export function LocalAnalysisGuide({ privacy = false }: { privacy?: boolean }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('viewgrid_lang');
      if (saved === 'tr' || saved === 'no') return saved;
    } catch { /* Storage may be unavailable. */ }
    return 'en';
  });
  const copy = content[language];

  return (
    <section id="local-analysis" className={styles.guide} lang={language}>
      <label className={styles.language}>
        <span>English / Türkçe / Norsk</span>
        <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
          <option value="no">Norsk</option>
        </select>
      </label>
      <h2>{privacy ? copy.privacyTitle : copy.title}</h2>
      <p>{privacy ? copy.privacy : copy.intro}</p>
      {!privacy && copy.sections.map(([title, description]) => (
        <div key={title}>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      ))}
    </section>
  );
}
