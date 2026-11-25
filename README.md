# Sito di Teresa Venturi, naturopata

Sito statico generato con [Eleventy](https://www.11ty.dev/), modificabile da [Pages CMS](https://app.pagescms.org) e pubblicato su Cloudflare Pages.

## Dove stanno i contenuti

| Cosa | File | Scheda nel CMS |
|---|---|---|
| Eventi (una pagina per evento) | `src/eventi/*.md` | Eventi |
| Consulenze e trattamenti | `src/_data/servizi.json` | Consulenze e trattamenti |
| Sedi | `src/_data/sedi.json` | Sedi |
| Domande frequenti | `src/_data/faq.json` | Domande frequenti |
| Testi delle sezioni | `src/_data/home.json` | Testi della homepage |
| Telefono, social, P. IVA, SEO, modulo | `src/_data/site.json` | Contatti e impostazioni |
| Privacy | `src/privacy.md` | Informativa privacy |
| Foto caricate | `src/media/` | Media |

Le foto vengono ridimensionate e convertite in WebP in fase di build (`eleventy.config.js`), quindi si possono caricare anche foto grandi dal telefono.

## Comandi

```bash
npm install
npm start        # anteprima locale su http://localhost:8080
npm run build    # genera il sito in _site/
```

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `_site`
- Variabili: `NODE_VERSION=22`; `SITE_INDEX=1` **solo al lancio** (finché manca, il sito è escluso da Google con `noindex` e `robots.txt`).

## Modulo di contatto

Incollare l'endpoint Formspree (`https://formspree.io/f/...`) nel campo `modulo_endpoint` di `src/_data/site.json`.
