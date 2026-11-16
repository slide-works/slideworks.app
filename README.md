# slideworks.app

The landing page for **SlideWorks**, the open-source web slide app: agents build decks over MCP from ready-made building blocks, and anyone presents them from a URL. The app itself lives in [`slide-works/slideworks`](https://github.com/slide-works/slideworks); the documentation lives in [`slide-works/docs`](https://github.com/slide-works/docs).

This is a stub (SW-105). It says what SlideWorks is and that it is in development. Copy, screenshots and a social card come as SW-1 ships.

| Folder | What it is |
|---|---|
| [`site/`](site/) | The website. Plain HTML and CSS with no build step: `index.html`, `site.css`, `tokens.css`, `favicon.svg`, `robots.txt` and `sitemap.xml`. |
| [`design/`](design/) | Reference assets: the placeholder mark and the design tokens. See [`design/README.md`](design/README.md). |

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
- Every screenshot needs a light and a dark version. The page shows the one that matches the visitor's theme.
- Keep the site free of organisation-specific names: SlideWorks is open source and generic.
