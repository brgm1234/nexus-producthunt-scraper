import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
await Actor.init();
const input = await Actor.getInput() ?? {};
const { categories = ['artificial-intelligence'], maxProducts = 30, period = 'daily' } = input;
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['BUYPROXIES94952'] });
const crawler = new PlaywrightCrawler({
  proxyConfiguration, headless: true, navigationTimeoutSecs: 90,
  async requestHandler({ page, request }) {
    await page.waitForTimeout(3000);
    const products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-test="post-item"]')).map(el => ({
        name: el.querySelector('[data-test="post-name"]')?.innerText?.trim() || el.querySelector('h3')?.innerText?.trim(),
        tagline: el.querySelector('[data-test="post-tagline"]')?.innerText?.trim(),
        upvotes: el.querySelector('[data-test="vote-button"]')?.innerText?.trim(),
        commentsCount: el.querySelector('[data-test="post-comments-count"]')?.innerText?.trim(),
        topics: Array.from(el.querySelectorAll('[data-test="topic"]')).map(t => t.innerText?.trim()),
        productUrl: 'https://www.producthunt.com' + (el.querySelector('a')?.getAttribute('href') ?? ''),
        imageUrl: el.querySelector('img')?.src,
        maker: el.querySelector('[data-test="maker-name"]')?.innerText?.trim(),
        launchDate: el.querySelector('time')?.getAttribute('datetime'),
      })).filter(p => p.name);
    });
    console.log('Found ' + products.length + ' products for: ' + request.userData.category);
    await Actor.pushData(products.slice(0, request.userData.maxProducts));
  },
});
const requests = categories.map(category => ({
  url: 'https://www.producthunt.com/topics/' + encodeURIComponent(category),
  userData: { category, maxProducts }
}));
await crawler.run(requests);
await Actor.exit();