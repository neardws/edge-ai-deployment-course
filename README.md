# 端侧模型量化部署技术专题

This repository contains a public online course book and HTML slide deck for “端侧模型量化部署技术专题”.

The course book expands the original outline into illustrated chapters with diagrams, code snippets, Ubuntu Server practice, Qwen small-model experiments, profiling templates, and references.

## Structure

- `docs/`: Docusaurus course book chapters.
- `labs/`: small scripts and templates for Ubuntu/Qwen practice.
- `src/pages/slides.tsx`: reveal.js HTML slide deck.
- `static/img/`: public visual assets.

The original Word outline is intentionally not committed. Public content is stored as Markdown, source code, and static assets.

## Local Development

Use Node.js 22 for local development. The repository includes both `.node-version` and `.nvmrc` so common version managers can pick the same runtime without hard-coding a machine-specific path.

See `CONTRIBUTING.md` for chapter authoring and maintenance guidelines.

```bash
fnm use
npm ci
npm run start
```

If your machine uses nvm instead of fnm:

```bash
nvm use
npm ci
npm run start
```

## Build

```bash
npm run build
```

The static site is generated into `build/`.

## CI

`.github/workflows/ci.yml` runs `npm ci`, `npm run typecheck`, and `npm run build` on pull requests and pushes to `main`. The generated `build/` directory is uploaded as a workflow artifact for review or manual publishing.

## Deployment

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `build`
- Production branch: `main`

## License

Code is licensed under the MIT License. Course content is licensed under CC BY 4.0; see `CONTENT_LICENSE.md`.
