import { CodeMazeScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('CodeMazeScraper', async () => {
  const scraper = new CodeMazeScraper();
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
