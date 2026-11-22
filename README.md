# slideworks.app

The landing page for **SlideWorks**, the open-source web slide app: agents build decks over MCP from ready-made building blocks, and anyone presents them from a URL. The app itself lives in [`slide-works/slideworks`](https://github.com/slide-works/slideworks); the documentation lives in [`slide-works/docs`](https://github.com/slide-works/docs).

The page is built from the design mockups in [`slide-works/slideworks/design`](https://github.com/slide-works/slideworks/tree/main/design). Every slide, app screen and phone on it is live HTML, not a screenshot: one sample deck ("Ship smaller", 16 slides), eight slides for the newer layouts, and the live-room slides (join, poll, word cloud and open text) are rendered with the mockups' own slide CSS, so it follows the visitor's light or dark theme and stays sharp at any size.

| Folder | What it is |
|---|---|
| [`site/`](site/) | The website. Plain HTML, CSS and JS with no build step: `index.html` (the page, plus the sample deck in a `<template>`), `site.css` (the page), `slides.css` (the slide engine and the four palettes), `site.js` (the player, the agent session, the gallery, the palette picker, the template editor, the presenter, the live poll, the word cloud and the Q&A), `tokens.css`, `og-image.png`, `favicon.svg`, `robots.txt` and `sitemap.xml`. |
| [`design/`](design/) | Reference assets: the placeholder mark, the design tokens and the social card. See [`design/README.md`](design/README.md). |

## Run it locally

Open `site/index.html` in a browser, or serve the folder:

```sh
npx serve site
```

## Deploy

Merging to `main` publishes the site. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) uploads `site/` to the Cloudflare Pages project `slideworks`, which serves `slideworks.app` and `www.slideworks.app`. It runs when something under `site/` or the workflow itself changes, and you can also start it by hand from the Actions tab.

The workflow needs two secrets, set on the repository or on the `slide-works` organisation: `CLOUDFLARE_API_TOKEN`, a token with **Account → Cloudflare Pages: Edit**, and `CLOUDFLARE_ACCOUNT_ID`. Until both exist, the deploy step is skipped with a notice rather than failing.

Every pull request that touches `site/` gets a preview. [`.github/workflows/preview.yml`](.github/workflows/preview.yml) publishes `site/` to the same Pages project on the branch `pr-<number>`, so it never touches production, and uploads `site/` as a workflow artifact. It then keeps one comment on the pull request with a link to that commit's preview, the stable `https://pr-<number>.slideworks.pages.dev` address and the artifact. Pull requests from forks get no secrets, so they get the artifact only.

To deploy by hand with the same token in your environment:

```sh
npx wrangler pages deploy site --project-name slideworks --branch main
```

## Editing the page

- Colours, fonts and radii come from `site/tokens.css`, a copy of `design/tokens/tokens.css`. Change the page's look there or in `site.css`, not with one-off hex values.
- Slides come from the `<template id="deck">` in `index.html`. Each slide is a layout with its slots as markup, ported from the SW-1 and SW-2 mockups; `site.js` adds the part tracker, footer and progress bar, and clones a slide into any `.frame`. The newer layouts (statement, flow, bars, stack, levels, loop, links and video) are in `<template id="more">` and fill the second gallery. The join, poll, word-cloud and open-text slides are in `<template id="live">`, and a frame asks for one with `data-live`. A slide's class must not match a class in `site.css`: the poll slide is `poll-slide` because `.poll` is the phone's poll card. Colours come from the palette tokens in `slides.css`, so a slide never sets its own.
- App screens (the decks library, the deck page) use the site tokens, so they follow the visitor's theme. The presenter window and the phones are always dark, as the real ones are.
- The page is a pitch: each section leads with what the feature does for the reader and links to the docs for the detail. Every feature on it is shipped. Things not yet built go only in the roadmap's Next or Planned column, and move to Ready to use when they ship.
- The custom-template section uses a made-up brand, Northwind, through the `data-brand` and `data-font` overrides at the end of `slides.css`. The contrast figures in its checklist are computed in `site.js`.
- The live poll, the word cloud and the Q&A are simulations in `site.js`: the rest of the room answers, sends words, upvotes and reacts on a timer while the section is on screen, and not at all with reduced motion.
- If you add a screenshot instead of live HTML, it needs a light and a dark version.
- The social card is `design/social/og-card.html`. Screenshot it at 1200×630 into `site/og-image.png` after changing it.
- Keep the site free of organisation-specific names: SlideWorks is open source and generic.
