import { Page } from 'puppeteer';

export default async function hideBot(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'upgrade-insecure-requests': '1',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,en;q=0.8',
  });
  await page.setRequestInterception(true);
  page.on('request', async request => {
    if (request.resourceType() === 'image') await request.abort();
    else await request.continue();
  });
}
