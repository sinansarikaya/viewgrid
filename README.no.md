# ViewGrid · 1.0.4

[English](README.md) · [Türkçe](README.tr.md) · [Norsk bokmål](README.no.md)

[Website](https://viewgrid.sinansarikaya.dev/) · [Chrome Web Store](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) · [Releases](https://github.com/sinansarikaya/viewgrid/releases)

![ViewGrid arbeidsområde — CastPost](website/public/screenshots/workspace.png)

**Lokal analyse**

![ViewGrid lokal analyse — CastPost](website/public/screenshots/local-analysis.png)

**Sammenlign visninger**

![ViewGrid sammenligning — CastPost](website/public/screenshots/compare.png)

**Test oppsett for mobil, nettbrett og datamaskin side om side i én fane.** ViewGrid er en gratis utvidelse med åpen kildekode for Chromium og Firefox. Grensesnittet og rapportene støtter tyrkisk, engelsk og norsk bokmål.

- 21 enhetsprofiler, 5 forhåndsdefinerte sett, egne størrelser og opptil 16 visninger; rutenett, rad, kolonne og fri plassering, sortering, justering, fokus, rotasjon og zoom rundt midten.
- Synkronisering av rulling, klikk, navigasjon, oppdatering, inndata/skjemaer og tastetrykk kan slås av og på hver for seg; arbeidsområder og innstillinger lagres lokalt.
- Delt visning, gardin og sammenligning side om side med eksporterte PNG/SVG-designlag. Ingen Figma API-integrasjon eller automatisk poengsum for pikselforskjeller.
- PNG for én eller alle utvidede visninger, oppdelt opptak av store visninger, grense på 32 megapiksler og avbryt med Escape. Arbeidsområdebildet viser det synlige området, ikke hele nettsidedokumentet.
- Grupperte funn med enhet, målinger og selektorer, filtre og fremheving av elementer; kopiering av Markdown, JSON og utskriftsvennlige HTML-rapporter. Unike funn og forekomster på enheter vises separat; valgfrie ergonomiske råd holdes adskilt.
- **Innebygd lokal analyse:** mobil, datamaskin eller begge som standard; observasjoner av innlasting, DOM-basert SEO, tilgjengelighetssjekker med axe og eksperimentelle GEO-signaler. Hver del tilbyr kopiering/nedlasting av sin egen Markdown-rapport. Resultater beholdes i økten og merkes som utdaterte når målet endres; dekning og mislykkede sjekker vises.
- Myke overganger for paneler/menyer, støtte for redusert bevegelse og menyer som lukkes med klikk utenfor eller Escape.

**Installasjon:** Last ned gjeldende nettleser-ZIP og `SHA256SUMS` fra Releases. Chromium: pakk ut, åpne `chrome://extensions`, aktiver utviklermodus og velg Last inn upakket. Firefox: `about:debugging#/runtime/this-firefox` → Last inn midlertidig tillegg → `manifest.json`; tillegget fjernes ved omstart. Bruk signerte AMO-pakker for permanent Firefox-installasjon. Kildepakker bruker `dist/chromium` eller `dist/firefox`. GitHub-pakker og butikkgodkjenning er separate; butikkene kan beholde gjeldende 1.0.3 til vurdering/publisering av 1.0.4 er fullført.

**Begrensninger og sikkerhet:** Analysen krever ingen ekstern API, Google/CrUX-forespørsel, konto eller ekstra analyseverktøy. Lokale observasjoner er ikke Lighthouse-poeng eller Core Web Vitals fra virkelige brukere; full nettstedsgjennomgang, DAST og samsvarssertifisering tilbys ikke. GEO-signaler garanterer ikke rangering eller synlighet i KI-tjenester. Ingen funn beviser ikke samsvar; skannegrenser, shadow DOM og nestede rammer fra andre opprinnelser kan begrense dekningen.

Synkronisering av inndata/skjemaer/tastetrykk begrenses til samme origin. Innsamling og gjengivelse blokkeres for passord, engangskoder og betalingsfelt som gjenkjennes gjennom type, autocomplete og navn/ID. Forhåndsvisningen kontrolleres mot det faktiske overordnede arbeidsområdet, direkte iframe-identitet og bekreftet frame/document-registrering; meldinger opprettet av siden godtas ikke som bevis på tilknytning.

Utvidelsen har ingen telemetri eller skyproxy; valgte nettsteder gjør sine vanlige nettverksforespørsler. Unntak for innramming krever bekreftede arbeidsområdefaner: Firefox fjerner XFO og CSP `frame-ancestors` i direkte forhåndsvisninger; Chromium fjerner XFO og alle CSP-svarhoder i arbeidsområdets underrammer, også nestede rammer. Vanlige faner beholder innrammingsvernet. Før forhåndsvisning fjernes nettstedets service worker-registreringer etter origin (Chromium) eller vertsnavn (Firefox); dette kan også påvirke workerne i vanlige faner for samme nettsted. Sletting av cookies, localStorage, sessionStorage, IndexedDB og CacheStorage forespørres ikke. Tillatelser, innlogging, tredjepartscookies og sandbox-regler kan hindre forhåndsvisning. Profilene angir CSS-visningsstørrelser uten å emulere mobilmaskinvare, DPR eller nettlesermotorer. Ingen fast garanti for RAM, FPS eller forsinkelse gis.

## Utvikling

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run typecheck:website
pnpm test
pnpm run build:all
pnpm run lint:web-ext
pnpm exec playwright install --with-deps chromium
pnpm run test:e2e
pnpm run build:website
pnpm run package:release
```

[Utgivelsesnotater](docs/RELEASE_NOTES_1.0.4.md) · [Endringslogg](CHANGELOG.md) · [Personvern](docs/PRIVACY.md) · [Sikkerhet](SECURITY.md) · [Testing](docs/TESTING.md) · [MIT-lisens](LICENSE)

[Sinan Sarıkaya](https://github.com/sinansarikaya) · [Støtt prosjektet](https://github.com/sponsors/sinansarikaya)
