import React, { useState } from 'react';
import { siteConfig } from '../data/site.config';

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = siteConfig.faqs;

  // JSON-LD structured data for FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <section className="faq-section" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container">
        <div className="section-header">
          <span className="section-tag">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="section-title">Answers to common technical questions</h2>
          <p className="section-desc">
            Everything you need to know about ViewGrid architecture, browser support, security, and local dev execution.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? 'faq-open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{faq.question}</span>
                  <span className="faq-toggle-icon">{isOpen ? '−' : '＋'}</span>
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .faq-section {
          padding: 88px 0;
          border-top: 1px solid var(--border-dim);
          background: rgba(10, 15, 29, 0.3);
        }
        .faq-list {
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .faq-card {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .faq-card:hover {
          border-color: var(--border-bright);
        }
        .faq-card.faq-open {
          border-color: var(--accent-cyan);
          background: #0d1527;
        }
        .faq-question-btn {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          color: #ffffff;
        }
        .faq-q-text {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .faq-toggle-icon {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          color: var(--accent-cyan);
          flex-shrink: 0;
        }
        .faq-answer {
          padding: 0 24px 22px;
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 16px;
        }
      `}</style>
    </section>
  );
}
