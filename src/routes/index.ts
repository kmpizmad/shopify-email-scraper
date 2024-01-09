import express, { Request } from 'express';
import { Browser, Page, executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import hideBot from '../utils/hideBot';
import scrapeEmail from '../utils/scrapeEmail';
import getNextPageUrl from '../utils/getNextPageUrl';
import createSpreadsheet from '../utils/createSpreadsheet';
import path from 'path';
import { logger } from '../clients/logger';

const open = import('open').then(m => m.default);
const router = express.Router();

puppeteer.use(stealth());

router.post('/', async (req: Request<unknown, unknown, { urls?: string[] }>, res, next) => {
  if (!req.body.urls) return next(new Error("'urls' must be provided!"));

  const urls = req.body.urls.filter(url => url.startsWith('https://'));
  const emails: string[][] = [];
  const websites: string[] = [];

  // const results = await Promise.allSettled(urls.map(scrapeUrl));
  // const fulfilled = results.filter(promise => promise.status === 'fulfilled') as PromiseFulfilledResult<
  //   string[] | null
  // >[];

  // fulfilled.forEach((promise, id) => {
  //   if (promise.value) emails.push(promise.value);
  //   else websites.push(urls[id] as string);
  // });

  const browser = await createBrowser();

  let iter: number = 0;
  for (const url of urls) {
    try {
      const scrapedEmails = await scrapeUrl(url, browser);
      if (scrapedEmails) emails.push(scrapedEmails);
      else websites.push(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error(`${error?.message || 'Unknown error'}: ${url}`);
    } finally {
      logger.info(`Remaining pages: ${urls.length - ++iter}`);
      logger.debug(
        `${JSON.stringify({
          emailCount: emails.length,
          totalCount: emails.map(email => email.length).reduce((prev, curr) => prev + curr, 0),
        })}`,
      );
    }
  }

  await browser.close();

  await openRemainingWebsites(websites);
  await createSpreadsheet(
    emails,
    `${new Date().toISOString().split('T')[0]}_old.xlsx`,
    path.resolve(__dirname, '..', '..', '..', 'sheets'),
  );

  res.status(200).json(emails);
});

export default router;

async function scrapeUrl(url: string, browser: Browser) {
  const allPages = await browser.pages();
  if (allPages.length > 50) {
    allPages.pop();
    await Promise.all(allPages.map(x => x.close()));
  }

  const homePage = await browser.newPage();
  await hideBot(homePage);

  // Scrape homepage
  await homePage.goto(url, { waitUntil: 'domcontentloaded' });
  const emailsOnHomepage = await scrapeEmail(homePage);

  // Scrape subpages
  const subpageUrls = await getPageUrls(homePage);
  const emailsOnSubpages = await Promise.all(
    subpageUrls.map(async subpageUrl => {
      const subpage = await browser.newPage();
      await hideBot(subpage);
      await subpage.goto(subpageUrl, { waitUntil: 'domcontentloaded' });
      logger.info(`Opening page: ${subpageUrl}`);
      return scrapeEmail(subpage);
    }),
  );

  const emailSet: Set<string> = new Set([...emailsOnHomepage, ...emailsOnSubpages.flat()]);

  if (emailSet.size > 0) return Array.from(emailSet);
  else return null;
}

async function getPageUrls(page: Page): Promise<string[]> {
  const allUrls = (
    await Promise.all([
      getNextPageUrl(page, 'contact'),
      getNextPageUrl(page, 'get-in-touch'),
      getNextPageUrl(page, 'faq'),
      getNextPageUrl(page, 'terms'),
      getNextPageUrl(page, 'refund'),
      getNextPageUrl(page, 'return'),
      getNextPageUrl(page, 'shipping'),
      getNextPageUrl(page, 'shopping'),
      getNextPageUrl(page, 'policies'),
      getNextPageUrl(page, 'policy'),
      getNextPageUrl(page, 'law'),
      getNextPageUrl(page, 'legal'),
      getNextPageUrl(page, 'about'),
      getNextPageUrl(page, 'sale'),
      getNextPageUrl(page, 'impressum'),
      getNextPageUrl(page, 'imprint'),
      getNextPageUrl(page, 'inquiry'),
      getNextPageUrl(page, 'inquiries'),
      getNextPageUrl(page, 'press'),
    ])
  )
    .flat()
    .filter(p => !!p) as string[];
  return Array.from(new Set(allUrls));
}

async function openRemainingWebsites(websites: string[]) {
  const o = await open;
  return await Promise.all(websites.map(async site => o(site)));
}

async function createBrowser() {
  return await puppeteer.launch({ headless: true, executablePath: executablePath() });
}
