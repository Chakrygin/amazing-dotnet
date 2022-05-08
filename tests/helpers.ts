import Scraper from '../src/scrapers/Scraper';

import Sender from '../src/senders/Sender';
import TelegramSender from '../src/senders/TelegramSender';
import ValidateSender from '../src/senders/ValidateSender';

import Storage from '../src/Storage';

export async function testScraper(scraper: Scraper): Promise<void> {
  const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
  const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

  const storage = new Storage(scraper.path);

  let sender: Sender;
  sender = new TelegramSender(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);
  sender = new ValidateSender(sender);

  await scraper.scrape(storage, sender);
}

function getInput(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Failed to retrieve '${name}' value from environment variables.`);
  }

  return value;
}
