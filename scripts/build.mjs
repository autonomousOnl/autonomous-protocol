#!/usr/bin/env node
// build.mjs — copies src/ into dist/, the complete deployment artifact.
// No bundler, no external deps: this project ships exactly the files it
// is written in, so what you read in src/ is what ships.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyFile(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function copyDir(from, to) {
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(fromPath, toPath);
    } else if (entry.isFile()) {
      await copyFile(fromPath, toPath);
    }
  }
}

async function main() {
  console.log("[build] cleaning dist/");
  await rmrf(distDir);
  await fs.mkdir(distDir, { recursive: true });

  console.log("[build] copying static files");
  await copyFile(path.join(srcDir, "index.html"), path.join(distDir, "index.html"));
  await copyFile(path.join(srcDir, "robots.txt"), path.join(distDir, "robots.txt"));
  await copyFile(path.join(srcDir, "sitemap.xml"), path.join(distDir, "sitemap.xml"));
  await copyFile(path.join(srcDir, "site.webmanifest"), path.join(distDir, "site.webmanifest"));
  await copyFile(path.join(srcDir, "assets", "favicon.svg"), path.join(distDir, "favicon.svg"));

  console.log("[build] copying styles/");
  await copyDir(path.join(srcDir, "styles"), path.join(distDir, "styles"));

  console.log("[build] copying scripts/");
  await copyDir(path.join(srcDir, "scripts"), path.join(distDir, "scripts"));

  console.log("[build] copying assets/ (brand-derived icons + og cover)");
  await copyDir(path.join(srcDir, "assets"), path.join(distDir, "assets"));

  const requiredFiles = [
    "index.html",
    "favicon.svg",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
    "styles/tokens.css",
    "styles/base.css",
    "styles/components.css",
    "styles/animations.css",
    "scripts/register.js",
    "scripts/format.js",
    "scripts/gate.js",
    "scripts/chain.js",
    "scripts/tvl.js",
    "scripts/copy.js",
    "scripts/reveal.js",
    "scripts/tilt.js",
    "scripts/toast.js",
    "scripts/main.js",
    "assets/icon-192.png",
    "assets/icon-512.png",
    "assets/apple-touch-icon.png",
    "assets/logo-mark.png",
    "assets/hero-mark.png",
    "assets/og-cover.jpg",
  ];

  for (const rel of requiredFiles) {
    const full = path.join(distDir, rel);
    await fs.access(full);
  }

  console.log(`[build] done — ${requiredFiles.length} files verified in dist/`);
}

main().catch((err) => {
  console.error("[build] failed:", err);
  process.exitCode = 1;
});
