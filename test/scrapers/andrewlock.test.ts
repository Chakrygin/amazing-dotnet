import { AndrewLockScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('AndrewLockScraper', async () => {
  const scraper = new AndrewLockScraper();
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
