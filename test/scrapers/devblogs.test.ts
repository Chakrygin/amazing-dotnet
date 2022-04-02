import { DevBlogsScraper } from "../../src/scrapers";
import { ConsoleSender } from "../../src/senders";
import { Storage } from "../../src/storage";

test('DevBlogsScraper / .NET Blog', async () => {
  const scraper = new DevBlogsScraper('dotnet');
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});

test('DevBlogsScraper / TypeScript', async () => {
  const scraper = new DevBlogsScraper('typescript');
  const storage = new Storage(scraper.path);
  const sender = new ConsoleSender();
  await scraper.scrape(storage, sender);
});
