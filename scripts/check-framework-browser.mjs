import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Nuwanda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.argv[2] || 'http://127.0.0.1:4322';
const out = process.env.BROWSER_REPORT_DIR || join(process.cwd(), '.local/phase1/browser');
mkdirSync(out, { recursive: true });
const report = { base, checkedAt: new Date().toISOString(), pages: [], errors: [] };
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const width of [320, 375, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
    for (const route of ['', 'life/', 'notes/', 'guard/']) {
      assert.equal((await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' })).status(), 200);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `Overflow ${route} at ${width}`);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `https://nuwanda.space/${route}`);
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        assert.ok(await img.getAttribute('alt'));
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').textContent(), '跳至主要内容');
      const focus = await page.locator(':focus').evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, top: el.getBoundingClientRect().top }));
      assert.equal(focus.outline, 'solid');
      assert.ok(focus.top >= 0);
      await page.locator(':focus').press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
      if (!route) {
        await page.locator('.enter-link').click();
        assert.equal(new URL(page.url()).pathname, '/life/');
        await page.goto(base + '/');
      } else {
        assert.equal(await page.locator('.blog-nav [aria-current=page]').count(), 1);
        for (const slug of ['life', 'notes', 'guard']) {
          await page.locator(`.blog-nav a[href="/${slug}/"]`).click();
          assert.equal(new URL(page.url()).pathname, `/${slug}/`);
          assert.equal(await page.locator('.blog-nav [aria-current=page]').getAttribute('href'), `/${slug}/`);
        }
        await page.goto(base + '/' + route);
      }
      if (route === 'notes/') {
        await page.locator('summary').first().focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('details').first().getAttribute('open'), '');
        assert.ok(await page.locator('.note-excerpt').first().isVisible());
        await page.keyboard.press('Enter');
      }
      // Navigation resets lazy-image state. Decode the final page before capture.
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator('h1').click();
      await page.screenshot({ path: join(out, `${route.replace('/', '') || 'home'}-${width}.png`), fullPage: true });
      report.pages.push({ route: '/' + route, width, noOverflow: true, imagesLoaded: true, keyboard: true, noJavaScript: true, reload: true });
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  for (const route of ['/', '/life/', '/notes/', '/guard/']) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.scripts.length), 0);
  }
  await page.goto(base + '/timeline/');
  await page.locator('a[href="/guard/"]').click();
  assert.equal(new URL(page.url()).pathname, '/guard/');
  await page.goto(base + '/environment/browser/');
  await page.locator('#verify-browser').click();
  assert.equal(await page.locator('#browser-result').textContent(), '浏览器脚本正常');
  report.browserSmoke = true;
  await context.close();
  const fallback = await browser.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  await fallback.route('**/*', route => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto(base + '/');
  assert.ok(await fallbackPage.locator('.enter-link').isVisible());
  assert.equal(await fallbackPage.locator('.hero-cover').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(34, 44, 38)');
  assert.equal(await fallbackPage.locator('.enter-link').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  await fallbackPage.screenshot({ path: join(out, 'home-image-fallback.png'), fullPage: true });
  report.imageFallback = true;
  report.reducedMotion = true;
  await fallback.close();
  assert.deepEqual(report.errors, []);
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: 'PASS', pageViewports: report.pages.length, browserSmoke: true, imageFallback: true, errors: report.errors, screenshots: out }));
} catch (error) {
  writeFileSync(join(out, 'failure.json'), JSON.stringify({ ...report, failure: error.stack }, null, 2));
  throw error;
} finally { await browser.close(); }
