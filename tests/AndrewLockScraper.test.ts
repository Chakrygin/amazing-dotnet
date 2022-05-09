import AndrewLockScraper from '../src/scrapers/AndrewLockScraper';

import { testScraper } from './helpers';

test('AndrewLock', async () => {
  const scraper = new AndrewLockScraper();
  await testScraper(scraper);
});
