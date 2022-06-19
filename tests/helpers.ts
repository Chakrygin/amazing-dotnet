import Scraper from '../src/scrapers/Scraper';

import { createSender } from '../src/senders';

import Storage from '../src/Storage';

export async function testScraper(scraper: Scraper): Promise<void> {
  const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
  const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

  const storage = new Storage('tests');
  const sender = createSender(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);

  await scraper.scrape(storage, sender);
}

function getInput(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Failed to retrieve '${name}' value from environment variables.`);
  }

  return value;
}
