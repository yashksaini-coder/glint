import { createMDX } from 'fumadocs-mdx/next';
import { fileURLToPath } from 'node:url';

const withMDX = createMDX();
const root = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  output: 'export', // GitHub Pages serves static files only
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined, // /glint on Pages, nothing locally
  images: { unoptimized: true },
  reactStrictMode: true,
  // site/ has its own lockfile inside the app's repo; pin the root so Next doesn't pick the parent.
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default withMDX(config);
