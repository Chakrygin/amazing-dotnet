import AndrewLockScraper from '../src/scrapers/AndrewLockScraper';

import { testScraper } from './helpers';

test('AndrewLockScraper', async () => {
  const scraper = new AndrewLockScraper();
  await testScraper(scraper);
});
