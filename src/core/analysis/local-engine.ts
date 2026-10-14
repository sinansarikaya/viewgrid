import { evaluateGeo } from './geo';
import { analysisResultSchema, type AnalysisResult, type NormalizedAudit, type AnalysisProfile } from './schema';

export const LOCAL_RULE_VERSION = '1.0.0';
export const LOCAL_LIMITS = { elements: 2000, nodes: 6000, characters: 100000, attribute: 2048, json: 16384, evidence: 20, chunk: 100, axeMs: 1500 } as const;
export interface LocalElement { tag: string; attrs: Record<string, string>; text: string; clipped: boolean }
export interface LocalSnapshot { elements: LocalElement[]; truncated: boolean }
type Language = 'tr' | 'en' | 'no';
type Copy = readonly [string, string, string];
const copy: Record<string, readonly [Copy, Copy]> = {
  'document-title': [['Belge başlığı', 'Document title', 'Dokumenttittel'], ['Kısa ve açıklayıcı bir title ekleyin.', 'Add a concise, descriptive title.', 'Legg til en kort, beskrivende tittel.']],
  'meta-description': [['Meta açıklaması', 'Meta description', 'Metabeskrivelse'], ['Sayfaya özgü bir meta açıklaması ekleyin.', 'Add a page-specific meta description.', 'Legg til en metabeskrivelse for siden.']],
  canonical: [['Canonical URL', 'Canonical URL', 'Canonical-URL'], ['Tek bir geçerli HTTP/HTTPS canonical belirtin; hedefin doğruluğunu elle inceleyin.', 'Provide one valid HTTP/HTTPS canonical; review its target manually.', 'Angi én gyldig HTTP/HTTPS canonical; kontroller målet manuelt.']],
  'heading-order': [['Başlık sırası', 'Heading order', 'Overskriftsrekkefølge'], ['Başlık seviyelerini atlamadan sıralayın.', 'Order heading levels without skipping levels.', 'Ordne overskrifter uten å hoppe over nivåer.']],
  'landmark-one-main': [['Ana içerik bölgesi', 'Main landmark', 'Hovedområde'], ['Bir ana içerik bölgesi belirtin.', 'Provide one main landmark.', 'Angi ett hovedområde.']],
  'link-text': [['Açıklayıcı bağlantılar', 'Descriptive links', 'Beskrivende lenker'], ['Bağlantının amacını açıklayan erişilebilir bir ad kullanın.', 'Use an accessible name describing the link purpose.', 'Bruk et tilgjengelig navn som beskriver lenkens formål.']],
  'crawlable-anchors': [['Bağlantı URL sözdizimi', 'Link URL syntax', 'Syntaks for lenke-URL'], ['Gezinme bağlantılarında geçerli HTTP/HTTPS href kullanın; crawler erişimi ayrıca doğrulanmalıdır.', 'Use valid HTTP/HTTPS href for navigation; crawler access needs separate verification.', 'Bruk gyldig HTTP/HTTPS href for navigasjon; crawler-tilgang må kontrolleres separat.']],
  'image-alt': [['Görsel alternatifleri', 'Image alternatives', 'Bildealternativer'], ['Görsellere alt ekleyin; dekoratif görsellerde boş alt kullanın.', 'Add alt attributes; use empty alt for decorative images.', 'Legg til alt-attributter; bruk tom alt for dekorative bilder.']],
  viewport: [['Viewport meta etiketi', 'Viewport meta', 'Viewport-meta'], ['device-width içeren viewport ekleyin; yakınlaştırmayı engellemeyin.', 'Add a device-width viewport; allow zoom.', 'Legg til device-width viewport; tillat zoom.']],
  'is-crawlable': [['Robots meta sinyali', 'Robots meta signal', 'Robots-meta-signal'], ['Yalnız meta incelendi. Robots.txt, HTTP başlıkları ve crawler erişimini elle doğrulayın.', 'Only meta was inspected. Manually verify robots.txt, HTTP headers and crawler access.', 'Bare meta ble undersøkt. Kontroller robots.txt, HTTP-headere og crawler-tilgang manuelt.']],
  hreflang: [['Hreflang sözdizimi ve self referans', 'Hreflang syntax and self reference', 'Hreflang-syntaks og selvreferanse'], ['Geçerli dil ve URL kullanın; dil alternatifleri varsa self referans ekleyin. Karşılıklı referanslar taranmadı.', 'Use valid languages and URLs; include a self reference when alternatives exist. Reciprocal links were not crawled.', 'Bruk gyldige språk og URL-er; inkluder selvreferanse ved alternativer. Gjensidige lenker ble ikke gjennomsøkt.']],
  'structured-data': [['JSON-LD sözdizimi ve temel yapı', 'JSON-LD syntax and basic shape', 'JSON-LD-syntaks og grunnstruktur'], ['Geçerli JSON-LD nesneleri ve @type veya @graph kullanın. Bu kontrol sıralama ya da zengin sonuç garantisi değildir.', 'Use valid JSON-LD objects with @type or @graph. This check does not guarantee ranking or rich results.', 'Bruk gyldige JSON-LD-objekter med @type eller @graph. Dette garanterer ikke rangering eller utvidede resultater.']],
  'crawler-policy': [['Crawler politikası', 'Crawler policy', 'Crawler-policy'], ['Robots.txt ve HTTP başlıklarını elle inceleyin; yerel motor bunları istemez.', 'Review robots.txt and HTTP headers manually; the local engine does not request them.', 'Kontroller robots.txt og HTTP-headere manuelt; den lokale motoren henter dem ikke.']],
  'axe-button-name': [["Düğmelerin erişilebilir adı", "Accessible button names", "Tilgjengelige knappenavn"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-input-button-name': [["Giriş düğmelerinin erişilebilir adı", "Accessible input button names", "Tilgjengelige navn for inndataknapper"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-label': [["Form alanı etiketleri", "Form field labels", "Etiketter for skjemafelt"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-select-name': [["Seçim alanlarının erişilebilir adı", "Accessible select names", "Tilgjengelige navn for valgfelter"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-aria-allowed-attr': [["Role uygun ARIA öznitelikleri", "ARIA attributes allowed by role", "ARIA-attributter tillatt for rollen"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-aria-valid-attr': [["Geçerli ARIA öznitelikleri", "Valid ARIA attributes", "Gyldige ARIA-attributter"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-aria-valid-attr-value': [["Geçerli ARIA değerleri", "Valid ARIA attribute values", "Gyldige ARIA-verdier"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-aria-required-attr': [["Zorunlu ARIA öznitelikleri", "Required ARIA attributes", "Påkrevde ARIA-attributter"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-aria-roles': [["Geçerli ARIA rolleri", "Valid ARIA roles", "Gyldige ARIA-roller"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-html-has-lang': [["Belge dili belirtilmiş", "Document language declared", "Dokumentspråk angitt"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-html-lang-valid': [["Geçerli belge dili", "Valid document language", "Gyldig dokumentspråk"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  'axe-duplicate-id-aria': [["ARIA referanslarında benzersiz kimlikler", "Unique IDs in ARIA references", "Unike ID-er i ARIA-referanser"], ["Bu kuralın bildirdiği öğeleri sayfada inceleyin; erişilebilir adları, etiketleri ve ARIA ilişkilerini klavye ve ekran okuyucuyla doğrulayın.", "Review elements reported by this rule; verify accessible names, labels and ARIA relationships with keyboard and screen reader.", "Kontroller elementene som regelen rapporterer; test tilgjengelige navn, etiketter og ARIA-relasjoner med tastatur og skjermleser."]],
  axe: [['Yerel axe erişilebilirlik kontrolü', 'Local axe accessibility check', 'Lokal axe-kontroll av tilgjengelighet'], ['Bildirilen kuralı inceleyin ve klavye/ekran okuyucu ile doğrulayın; otomatik kontrol tam uygunluk kanıtı değildir.', 'Review the reported rule and verify with keyboard/screen reader; automation is not proof of full conformance.', 'Kontroller regelen og test med tastatur/skjermleser; automatisering beviser ikke full samsvar.']],
};
export function localLanguage(locale: string): Language { const language = locale.toLowerCase().split('-')[0]; return language === 'en' || language === 'no' ? language : 'tr'; }
function translate(value: Copy, locale: string): string { return value[({ tr: 0, en: 1, no: 2 } as const)[localLanguage(locale)]]; }
export function localAuditWording(id: string, locale: string): { title: string; recommendation: string } | null {
  const wording = copy[id];
  return wording ? { title: translate(wording[0], locale), recommendation: translate(wording[1], locale) } : null;
}
export function localAudit(id: string, status: NormalizedAudit['status'], locale: string, category: NormalizedAudit['category'] = 'seo', evidence: readonly LocalElement[] = []): NormalizedAudit {
  const wording = copy[id] ?? copy.axe!;
  return { id, category, title: translate(wording[0], locale), recommendation: translate(wording[1], locale), status,
    score: null, weight: 0, importance: status === 'fail' ? 'high' : 'informational', displayValue: null,
    affectedItems: evidence.slice(0, LOCAL_LIMITS.evidence).map(element => ({ selector: /^[a-z][a-z0-9-]{0,30}$/.test(element.tag) ? element.tag : null, snippet: null, text: null, url: null })) };
}
function safeUrl(value: string | undefined, base: string): string | null {
  try { if (!value || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\')) return null; const url = new URL(value, base); if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null; url.hash = ''; return url.href; } catch { return null; }
}
function jsonShape(value: unknown, depth = 0): boolean {
  if (depth > 8 || !value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.length > 0 && value.length <= 100 && value.every(item => jsonShape(item, depth + 1));
  const item = value as Record<string, unknown>;
  if (item['@graph'] !== undefined) return jsonShape(item['@graph'], depth + 1);
  const type = item['@type'];
  return typeof type === 'string' ? type.trim().length > 0 : Array.isArray(type) && type.length > 0 && type.length <= 100 && type.every(name => typeof name === 'string' && name.trim().length > 0);
}

/** Pure evaluation: no DOM, network, page text or axe HTML in the result. */
export function evaluateLocalDom(snapshot: LocalSnapshot, url: string, locale: string): NormalizedAudit[] {
  const all = snapshot.elements, find = (tag: string) => all.filter(element => element.tag === tag);
  const audits: NormalizedAudit[] = [];
  const add = (id: string, failures: LocalElement[], present = true, category: NormalizedAudit['category'] = 'seo') => {
    const status = failures.length ? 'fail' : snapshot.truncated ? 'unknown' : present ? 'pass' : 'fail';
    audits.push(localAudit(id, status, locale, category, failures));
  };
  const titles = find('title'); add('document-title', titles.filter(element => !element.text.trim()), titles.length === 1);
  const meta = find('meta'), named = (name: string) => meta.filter(element => element.attrs.name?.toLowerCase() === name);
  const descriptions = named('description'); add('meta-description', descriptions.filter(element => !element.attrs.content?.trim()), descriptions.length === 1);
  const canonicals = find('link').filter(element => element.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  add('canonical', canonicals.filter(element => !safeUrl(element.attrs.href, url)), canonicals.length === 1);
  let previous = 0;
  const headings = all.filter(element => /^h[1-6]$/.test(element.tag));
  add('heading-order', headings.filter(element => { const level = Number(element.tag[1]); const skipped = level > previous + 1; previous = level; return skipped; }), headings.length > 0, 'accessibility');
  const mains = all.filter(element => element.tag === 'main' || element.attrs.role?.toLowerCase() === 'main');
  add('landmark-one-main', mains.length > 1 ? mains : [], mains.length === 1, 'accessibility');
  const links = find('a').filter(element => element.attrs.href !== undefined);
  const weak = /^(?:click here|here|read more|learn more|buraya tıkla|tıklayın|devamı|les mer|klikk her)$/i;
  const labels = new Map(all.filter(element => element.attrs.id).map(element => [element.attrs.id!, element.text]));
  const unresolved = new Set<LocalElement>();
  const unnamed = links.filter(element => {
    const ids = element.attrs['aria-labelledby']?.split(/\s+/).filter(Boolean) ?? [];
    if (snapshot.truncated && ids.some(id => !labels.has(id))) { unresolved.add(element); return false; }
    const referenced = ids.slice(0, 20).map(id => labels.get(id) ?? '').join(' ').slice(0, 512);
    const label = referenced || element.attrs['aria-label'] || element.text;
    return !label.trim() || weak.test(label.trim());
  });
  add('link-text', unnamed, true, 'accessibility');
  if (unresolved.size && !unnamed.length) audits[audits.length - 1]!.status = 'unknown';
  add('crawlable-anchors', links.filter(element => !safeUrl(element.attrs.href, url) && !/^(?:mailto:|tel:)/i.test(element.attrs.href ?? '')));
  add('image-alt', find('img').filter(element => element.attrs.alt === undefined), true, 'accessibility');
  const viewports = named('viewport');
  add('viewport', viewports.filter(element => !/width\s*=\s*device-width/i.test(element.attrs.content ?? '') || /user-scalable\s*=\s*(?:no|0)/i.test(element.attrs.content ?? '') || /maximum-scale\s*=\s*(?:0(?:\.\d+)?|1(?:\.0+)?)\b/i.test(element.attrs.content ?? '')), viewports.length === 1);
  const robots = meta.filter(element => /^(robots|googlebot|bingbot)$/i.test(element.attrs.name ?? ''));
  const noindex = robots.filter(element => /(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(element.attrs.content ?? ''));
  audits.push(localAudit('is-crawlable', noindex.length ? 'fail' : 'unknown', locale, 'seo', noindex));
  const alternates = find('link').filter(element => element.attrs.hreflang !== undefined && element.attrs.rel?.toLowerCase().split(/\s+/).includes('alternate'));
  const invalidAlternates = alternates.filter(element => { const lang = element.attrs.hreflang ?? ''; try { if (lang !== 'x-default') { if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang)) return true; Intl.getCanonicalLocales(lang); } } catch { return true; } return !safeUrl(element.attrs.href, url); });
  if (!alternates.length) audits.push(localAudit('hreflang', snapshot.truncated ? 'unknown' : 'not-applicable', locale));
  else add('hreflang', invalidAlternates, alternates.some(element => safeUrl(element.attrs.href, url) === safeUrl(url, url)));
  const scripts = find('script').filter(element => element.attrs.type?.toLowerCase() === 'application/ld+json');
  const malformed = scripts.filter(element => { if (element.clipped) return false; try { return !jsonShape(JSON.parse(element.text)); } catch { return true; } });
  const structuredStatus = malformed.length ? 'fail' : snapshot.truncated || scripts.some(element => element.clipped) ? 'unknown' : scripts.length ? 'pass' : 'not-applicable';
  audits.push(localAudit('structured-data', structuredStatus, locale, 'seo', malformed));
  audits.push(localAudit('crawler-policy', 'manual', locale));
  return audits;
}

export interface LocalResultInput { requestedUrl: string; finalUrl: string; profile: AnalysisProfile; locale: string; snapshot: LocalSnapshot; axeAudits: NormalizedAudit[]; width: number; height: number; durationMs: number; fcpMs: number | null }
export function buildLocalResult(input: LocalResultInput): AnalysisResult {
  const now = new Date().toISOString(), audits = [...evaluateLocalDom(input.snapshot, input.finalUrl, input.locale), ...input.axeAudits].slice(0, 300);
  const field = (scope: 'url' | 'origin'): AnalysisResult['field']['url'] => ({ source: 'local', scope, status: 'unavailable', reason: 'local-only', identifier: null, formFactor: null, period: null, periodReason: 'not-provided', metrics: { p75LcpMs: null, p75InpMs: null, p75Cls: null } });
  return analysisResultSchema.parse({ schemaVersion: 1, source: 'viewgrid-local', requestedUrl: input.requestedUrl, finalUrl: input.finalUrl, profile: input.profile, analyzedAt: now, retrievedAt: now,
    lab: { engine: { name: 'ViewGrid', version: LOCAL_RULE_VERSION, userAgent: null },
      local: { width: input.width, height: input.height, scannedElements: input.snapshot.elements.length, truncated: input.snapshot.truncated, durationMs: input.durationMs, ruleVersion: LOCAL_RULE_VERSION },
      conditions: { requestedProfile: input.profile, reportedFormFactor: null, locale: input.locale.slice(0, 200), throttlingMethod: null, throttling: null, screenEmulation: null, benchmarkIndex: null, measurementContext: 'local-preview' },
      scores: { performance: null, seo: null, accessibility: null }, metrics: { lcpMs: null, cls: null, fcpMs: input.fcpMs, speedIndexMs: null, tbtMs: null }, audits,
      warnings: [translate(['Yerel önizleme: tam Lighthouse, site taraması veya uygunluk sertifikası değildir.', 'Local preview: this is not full Lighthouse, a site crawl or a conformance certificate.', 'Lokal forhåndsvisning: dette er ikke full Lighthouse, gjennomsøking av nettstedet eller et samsvarssertifikat.'], input.locale), ...(input.snapshot.truncated ? [translate(['Tarama sınırına ulaşıldı; eksik kontroller bilinmiyor.', 'Scan limit reached; incomplete checks are unknown.', 'Grensen for skanning er nådd; ufullstendige kontroller er ukjente.'], input.locale)] : [])] },
    field: { url: field('url'), origin: field('origin') }, geo: evaluateGeo(audits), redactions: ['affected-content'] });
}

const passedDescriptions: Record<string, Copy> = {
  'document-title': ['Sayfanın boş olmayan bir başlığı var.', 'The page has a non-empty title.', 'Siden har en tittel som ikke er tom.'],
  'meta-description': ['Sayfada boş olmayan bir meta açıklaması var.', 'The page has a non-empty meta description.', 'Siden har en metabeskrivelse som ikke er tom.'],
  canonical: ['Tek ve geçerli bir HTTP/HTTPS canonical bulundu. Hedef adresin doğruluğu ayrıca incelenmelidir.', 'One valid HTTP/HTTPS canonical was found. Its target still needs review.', 'Én gyldig HTTP/HTTPS canonical ble funnet. Måladressen må vurderes separat.'],
  'heading-order': ['İncelenen başlıklarda seviye atlaması bulunmadı.', 'No skipped heading levels were found in the inspected headings.', 'Ingen hopp i overskriftsnivå ble funnet i de undersøkte overskriftene.'],
  'landmark-one-main': ['Sayfada tek bir ana içerik bölgesi bulundu.', 'One main content landmark was found.', 'Ett hovedområde for innhold ble funnet.'],
  'link-text': ['İncelenen bağlantıların boş veya genel olmayan bir adı var. Bağlantı amacının uygunluğu ayrıca incelenmelidir.', 'Inspected links have non-empty, non-generic names. Their purpose still needs review.', 'Undersøkte lenker har navn som ikke er tomme eller generiske. Formålet må vurderes separat.'],
  'crawlable-anchors': ['İncelenen bağlantı adresleri desteklenen URL sözdizimine uyuyor. Bot erişimi test edilmedi.', 'Inspected link addresses use supported URL syntax. Crawler access was not tested.', 'Undersøkte lenkeadresser bruker støttet URL-syntaks. Bot-tilgang ble ikke testet.'],
  'image-alt': ['İncelenen görsellerin alt özniteliği var. Alternatif metinlerin uygunluğu ayrıca incelenmelidir.', 'Inspected images have alt attributes. The suitability of their text still needs review.', 'Undersøkte bilder har alt-attributter. Tekstenes egnethet må vurderes separat.'],
  viewport: ['device-width içeren ve yakınlaştırmayı engellemeyen viewport etiketi bulundu.', 'A device-width viewport without the checked zoom restrictions was found.', 'En device-width viewport uten de kontrollerte zoombegrensningene ble funnet.'],
  hreflang: ['Dil alternatiflerinin sözdizimi ve sayfanın kendisine referansı uygun. Karşılıklı referanslar taranmadı.', 'Language alternative syntax and the self reference passed. Reciprocal references were not crawled.', 'Syntaks for språkalternativer og selvreferanse bestod. Gjensidige referanser ble ikke gjennomsøkt.'],
  'structured-data': ['JSON-LD sözdizimi ve temel nesne yapısı uygun. Schema.org anlam doğruluğu ayrıca incelenmelidir.', 'JSON-LD syntax and basic object shape passed. Schema.org semantics still need review.', 'JSON-LD-syntaks og grunnstruktur bestod. Schema.org-semantikk må vurderes separat.'],
};

/** Explain observed success without giving the user an instruction to fix a passing check. */
export function localAuditDescription(audit: NormalizedAudit, locale: string): string {
  if (audit.status === 'pass') {
    if (passedDescriptions[audit.id]) return translate(passedDescriptions[audit.id]!, locale);
    if (audit.id.startsWith('axe-')) return translate(['Seçili erişilebilirlik kuralında otomatik bir ihlal bulunmadı. Bu sonuç tam erişilebilirlik uygunluğu anlamına gelmez.', 'No automated violation was found for this accessibility rule. This does not establish full accessibility conformance.', 'Ingen automatisk feil ble funnet for denne tilgjengelighetsregelen. Dette beviser ikke full samsvar.'], locale);
  }
  if (audit.status === 'not-applicable') return translate(['Bu sayfada bu kuralın uygulanacağı bir öğe bulunmadı.', 'No applicable element was found on this page for this rule.', 'Ingen elementer på siden var relevante for denne regelen.'], locale);
  return localAuditWording(audit.id, locale)?.recommendation ?? audit.recommendation;
}
