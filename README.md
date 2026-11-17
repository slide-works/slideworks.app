# slideworks.app

The landing page for **SlideWorks**, the open-source web slide app: agents build decks over MCP from ready-made building blocks, and anyone presents them from a URL. The app itself lives in [`slide-works/slideworks`](https://github.com/slide-works/slideworks); the documentation lives in [`slide-works/docs`](https://github.com/slide-works/docs).

The page is built from the design mockups in [`slide-works/slideworks/design`](https://github.com/slide-works/slideworks/tree/main/design). Every slide, app screen and phone on it is live HTML, not a screenshot: one sample deck ("Ship smaller", all 17 blocks) is rendered with the mockups' own slide CSS, so it follows the visitor's light or dark theme and stays sharp at any size.

| Folder | What it is |
|---|---|
| [`site/`](site/) | The website. Plain HTML, CSS and JS with no build step: `index.html` (the page, plus the sample deck in a `<template>`), `site.css` (the page), `slides.css` (the slide engine and the four palettes), `site.js` (the player, the agent session, the gallery, the palette picker, the presenter and the poll), `tokens.css`, `og-image.png`, `favicon.svg`, `robots.txt` and `sitemap.xml`. |
| [`design/`](design/) | Reference assets: the placeholder mark, the design tokens and the social card. See [`design/README.md`](design/README.md). |

## Run it locally

Open `site/index.html` in a browser, or serve the folder:

```sh
npx serve site
```

## Deploy

Merging to `main` publishes the site. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) uploads `site/` to the Cloudflare Pages project `slideworks`, which serves `slideworks.app` and `www.slideworks.app`. It runs when something under `site/` or the workflow itself changes, and you can also start it by hand from the Actions tab.

The workflow needs two secrets, set on the repository or on the `slide-works` organisation: `CLOUDFLARE_API_TOKEN`, a token with **Account → Cloudflare Pages: Edit**, and `CLOUDFLARE_ACCOUNT_ID`. Until both exist, the deploy step is skipped with a notice rather than failing.

To deploy by hand with the same token in your environment:

```sh
npx wrangler pages deploy site --project-name slideworks --branch main
```

## Editing the page

- Colours, fonts and radii come from `site/tokens.css`, a copy of `design/tokens/tokens.css`. Change the page's look there or in `site.css`, not with one-off hex values.
- Slides come from the `<template id="deck">` in `index.html`. Each slide is a layout with its slots as markup, ported from the SW-1 and SW-2 mockups; `site.js` adds the part tracker, footer and progress bar, and clones a slide into any `.frame`. Colours come from the palette tokens in `slides.css`, so a slide never sets its own.
- App screens (the decks library, the deck page) use the site tokens, so they follow the visitor's theme. The presenter window and the phones are always dark, as the real ones are.
- Sections for Features that are designed but not built say so (SW-4 presenter view, SW-5 audience join). Move a Feature on the roadmap when it ships.
- If you add a screenshot instead of live HTML, it needs a light and a dark version.
- The social card is `design/social/og-card.html`. Screenshot it at 1200×630 into `site/og-image.png` after changing it.
- Keep the site free of organisation-specific names: SlideWorks is open source and generic.
