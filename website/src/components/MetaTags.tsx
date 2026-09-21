import React from 'react';
import { siteConfig } from '../data/site.config';

interface MetaTagsProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
}

export function MetaTags({
  title,
  description = siteConfig.product.description,
  canonicalPath = '/',
}: MetaTagsProps) {
  const fullTitle = title
    ? `${title} — ${siteConfig.product.name}`
    : `${siteConfig.product.name} — ${siteConfig.product.tagline}`;
  const canonicalUrl = `${siteConfig.product.canonicalUrl}${canonicalPath.replace(/^\//, '') ? canonicalPath : '/'}`;

  // Structured Data: SoftwareApplication & WebSite
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: siteConfig.product.name,
      description: siteConfig.product.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform (Google Chrome, Mozilla Firefox, Microsoft Edge, Brave)',
      softwareVersion: siteConfig.product.version,
      url: siteConfig.product.canonicalUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Person',
        name: siteConfig.product.author,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.product.name,
      url: siteConfig.product.canonicalUrl,
      description: siteConfig.product.tagline,
    },
  ];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteConfig.product.canonicalUrl}/icon128.png`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteConfig.product.canonicalUrl}/icon128.png`} />

      {/* JSON-LD Schemas */}
      {structuredData.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
