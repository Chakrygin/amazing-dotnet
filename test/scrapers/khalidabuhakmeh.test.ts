import { KhalidAbuhakmehScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('KhalidAbuhakmehScraper', async () => {
  const scraper = new KhalidAbuhakmehScraper();
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
