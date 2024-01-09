import { Page } from 'puppeteer';
import emailAddresses from 'email-addresses';
import validator from 'validator';

export default async function scrapeEmail(page: Page): Promise<string[]> {
  const pageContent = await getPageContent(page);
  const emailList = extractEmails(pageContent);
  const validatedList = emailList
    .map(email => (email.endsWith('.') ? email.slice(0, -1) : email).trim().replaceAll(' ', '').toLowerCase())
    .filter(email => {
      return (
        !email.endsWith('.jpg') &&
        !email.endsWith('.jpeg') &&
        !email.endsWith('.png') &&
        !email.endsWith('.gif') &&
        !email.endsWith('.webp') &&
        !email.endsWith('.heic') &&
        validator.isEmail(email)
      );
    });

  return validatedList;
}

async function getPageContent(page: Page): Promise<string[]> {
  if (page.url().endsWith('/password')) {
    throw new Error('Inactive website');
  }

  const emailElements = await page.evaluate(() => {
    const content = Array.from(document.querySelectorAll('a[href^="mailto:"]')) as HTMLAnchorElement[];
    return content.map(element => element.outerHTML);
  });

  const pageContent = await page.evaluate(() => {
    const content = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    const validElements = content.filter(element => {
      if (element?.id === 'shop-not-found') {
        throw new Error('Invalid url');
      }
      return !!element.innerText;
    });

    return validElements.map(element => {
      if ((element as HTMLAnchorElement)?.href?.includes('mailto:')) {
        return (element as HTMLAnchorElement).href.split(':')[1];
      }
      if (element.tagName.toLowerCase() === 'summary') {
        element.click();
        const sibling = element.nextElementSibling;
        if (sibling) return (sibling as HTMLElement).innerText;
      }
      return element.innerText;
    }) as string[];
  });

  return [...emailElements, ...pageContent];
}

function extractEmails(pageContent: string[]): string[] {
  return pageContent
    .flatMap(content => {
      const patternMatches = content.match(/[a-zA-Z0-9_.+-]+ *@ *[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gm);
      const recognitionMatches = emailAddresses
        .parseAddressList(content)
        ?.flatMap(email => (email.type === 'mailbox' ? email.address : email.addresses.map(x => x.address)));
      return recognitionMatches || patternMatches || [];
    })
    .filter(email => !!email);
}
