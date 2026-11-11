# Glint docs

The documentation site for [Glint](../README.md), built with [Fumadocs](https://fumadocs.dev) on Next.js.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

Pages are MDX files in `content/docs`. Every page is also available as Markdown (the Copy MD button, or `/llms.mdx/docs/scope/content.md`), and the whole site as `/llms.txt` and `/llms-full.txt`.

It is a static export, deployed to GitHub Pages by `.github/workflows/docs.yml`. Set `NEXT_PUBLIC_BASE_PATH=/glint` to build it the way Pages serves it.

## Credits

The layout is inspired by the [QMesh docs](https://docs.distributed-quantum.com), which in turn follow Better Auth's. The code here is written for Glint on [Fumadocs](https://fumadocs.dev) (MIT).
