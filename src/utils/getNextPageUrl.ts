import { Page } from 'puppeteer';

export default async function getNextPageUrl(page: Page, subpage: string): Promise<string[] | null> {
  const elements = await page.$$(`a[href*=${subpage}]`);
  if (elements) {
    const urls = await Promise.all(elements.map(async el => page.evaluate(x => x.href, el)));
    return Array.from(new Set(urls));
  }
  return null;
}
