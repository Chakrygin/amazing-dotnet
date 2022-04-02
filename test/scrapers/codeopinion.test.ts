import { CodeOpinionScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('CodeOpinionScraper', async () => {
  const scraper = new CodeOpinionScraper();
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
