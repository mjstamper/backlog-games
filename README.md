# BacklogGames

Source for [backloggames.com](https://www.backloggames.com) - a portal of free HTML5 games you can play instantly in the browser. No downloads, no plugins.

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), deployed as a static site to GitHub Pages.

## Game catalog

The catalog lives in [src/config/site.ts](src/config/site.ts). Each entry is a `Game` with a slug, title, description, category, status (`playable` or `coming-soon`), thumbnail, and tags.

| Game | Category | Status |
|------|----------|--------|
| Snake | Arcade | Playable |
| Breakout | Arcade | Coming soon |
| Memory Match | Puzzle | Coming soon |
| 2048 | Puzzle | Coming soon |
| Asteroids | Action | Coming soon |

### Adding a game

1. Add a `Game` entry to the `games` array in [src/config/site.ts](src/config/site.ts).
2. Drop a 16:10 thumbnail at `public/thumbnails/<slug>.svg` (or update the `thumbnail` path).
3. Implement the game and wire it into [src/pages/[slug].astro](src/pages/%5Bslug%5D.astro). Game logic lives in `src/scripts/` (see [src/scripts/snake.ts](src/scripts/snake.ts)) and is mounted through a component in `src/components/play/`.
4. Set `status: 'playable'` once it works. Coming-soon entries render [src/components/ComingSoonStage.astro](src/components/ComingSoonStage.astro).

## Development

### Prerequisites

- Node.js 22.12+ (recommended; Astro 6 may warn on older 22.x)
- npm

### Local development

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:4321`).

### Production build

```bash
npm run build
npm run preview
```

Output is written to `dist/`. GitHub Actions builds and deploys this folder automatically; you do not commit `dist/`.

## Deploy (GitHub Pages)

Hosting is [GitHub Pages](https://pages.github.com/) via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Every push to `main` builds Astro and deploys the result.

**First-time setup**

1. Push this repo to a **public** GitHub repository.
2. On GitHub: **Settings** -> **Pages** -> **Build and deployment** -> Source: **GitHub Actions**.
3. Push to `main` (or run the workflow manually under **Actions**).
4. Confirm the deploy succeeds under **Actions** -> **Deploy to GitHub Pages**.

**Custom domain**

The canonical URL is `https://www.backloggames.com` (see [astro.config.mjs](astro.config.mjs) and [public/CNAME](public/CNAME)).

1. **Settings** -> **Pages** -> **Custom domain** -> enter `www.backloggames.com`.
2. Add the DNS records below at your registrar.
3. Complete any domain verification TXT record GitHub requests.
4. Enable **Enforce HTTPS** once DNS checks pass.

**DNS records**

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

| Type | Host | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `YOUR_GITHUB_USERNAME.github.io` |

Remove old web-hosting A/CNAME records for `@` and `www`. Do **not** remove MX or mail-related TXT records if you still use email on the same domain.

Optional IPv6: add four `AAAA` records for `@` pointing to `2606:50c0:8000::153` through `2606:50c0:8003::153` ([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).

## SEO assets

- [public/robots.txt](public/robots.txt) references the sitemap URL.
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) generates `sitemap-index.xml` at build time (requires `site` in `astro.config.mjs`).
- The Open Graph image is referenced at `/og-image.png` in [src/layouts/Layout.astro](src/layouts/Layout.astro). Add a 1200x630 branded image at `public/og-image.png` for rich social previews.

## Project layout

| Path | Purpose |
|------|---------|
| `src/config/site.ts` | Game catalog and site metadata |
| `src/pages/` | Routes (`/` catalog, `/<slug>` per-game pages) |
| `src/components/` | UI components (`play/` holds game mounts) |
| `src/scripts/` | Game logic (e.g. `snake.ts`) |
| `src/layouts/Layout.astro` | Shared HTML shell, nav, footer, SEO |
| `public/` | Static assets, `CNAME`, `robots.txt` |
| `.github/workflows/deploy.yml` | GitHub Pages CI/CD |
