# Contributing

This repository is a Docusaurus course book and slide deck for the edge AI deployment course. Keep maintenance changes separate from course content changes so reviewers can see whether a pull request changes infrastructure, teaching material, or both.

## Local Environment

Use Node.js 22 for local development. The repository includes `.node-version` and `.nvmrc` so common version managers can select the same runtime without hard-coding a machine-specific path.

```bash
fnm use
```

```bash
nvm use
```

Install dependencies from the lockfile:

```bash
npm ci
```

## Adding Course Chapters

Course chapters live in `docs/` as Markdown files.

When adding a chapter:

1. Create a new `docs/*.md` file.
2. Add Docusaurus front matter with at least a `title`.
3. Use a top-level `#` heading that matches the chapter topic.
4. Add the document id to the appropriate category in `sidebars.ts`.
5. Run the local checks before opening a pull request.

For example, a new `docs/example-topic.md` file should usually appear in `sidebars.ts` as `example-topic`.

Do not commit the original Word outline or private source material. Public course content should be stored as Markdown, source code, and static assets.

## Labs And Assets

- Put runnable lab scripts in `labs/scripts/`.
- Put reusable lab templates in `labs/templates/`.
- Put public images and static files in `static/`.
- Put React page-level code in `src/pages/`.

Do not commit large local experiment artifacts, model weights, generated model files, logs, or profiling results. The repository ignores common local outputs such as `models/`, `*.gguf`, `*.safetensors`, `*.onnx`, `logs/`, and `results/`.

## Checks Before Submitting

Run these checks before opening a pull request:

```bash
npm ci
npm run typecheck
npm run build
```

GitHub Actions runs the same typecheck and build flow for pull requests and pushes to `main`. The generated static site is uploaded as a workflow artifact.

## License Boundaries

Code is licensed under the MIT License; see `LICENSE`.

Course text, agenda, slide content, and other teaching material are licensed under CC BY 4.0; see `CONTENT_LICENSE.md`.

Do not add private source documents, model weights, third-party content without redistribution rights, or license-restricted datasets to the public repository.
