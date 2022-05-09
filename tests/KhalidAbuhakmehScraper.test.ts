import KhalidAbuhakmehScraper from '../src/scrapers/KhalidAbuhakmehScraper';

import { testScraper } from './helpers';

test('KhalidAbuhakmeh', async () => {
  const scraper = new KhalidAbuhakmehScraper();
  await testScraper(scraper);
});
