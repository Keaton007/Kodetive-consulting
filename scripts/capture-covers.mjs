import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve('public/images/work');
const VIEWPORT = { width: 1600, height: 1000, deviceScaleFactor: 2 };

const TARGETS = [
  { slug: 'shredder', url: 'https://www.tryshredder.com/' },
  { slug: 'stat-ai', url: 'https://www.statsports.ai/' },
  { slug: 'unit-converter', url: 'https://www.unitconverter.it.com/' },
];

async function main() {
  if (!existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at ${CHROME_PATH}`);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: VIEWPORT,
  });

  for (const { slug, url } of TARGETS) {
    const page = await browser.newPage();
    console.log(`→ ${slug}: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      const out = path.join(OUT_DIR, `${slug}-cover.jpg`);
      await page.screenshot({
        path: out,
        type: 'jpeg',
        quality: 85,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });
      console.log(`  ✓ ${out}`);
    } catch (err) {
      console.error(`  ✗ ${slug} failed:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
