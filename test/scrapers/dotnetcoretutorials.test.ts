import { DotNetCoreTutorialsScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('DotNetCoreTutorialsScraper', async () => {
  const scraper = new DotNetCoreTutorialsScraper();
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
