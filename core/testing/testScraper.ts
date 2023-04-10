import path from 'path';

import { createSender, getInput, getKnownHosts } from '../helpers';
import { Scraper } from '../scrapers';
import { PostStorage } from '../storages';

export async function testScraper(createScraper: (knownHosts: string[]) => Scraper): Promise<void> {
  const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
  const TELEGRAM_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

  const knownHosts = getKnownHosts(
    path.join(process.cwd(), 'data'));
  const scraper = createScraper(knownHosts);
  const sender = createSender(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID);
  const storage = new PostStorage(
    path.join(process.cwd(), 'tmp'));

  await scraper.scrape(sender, storage);
}
