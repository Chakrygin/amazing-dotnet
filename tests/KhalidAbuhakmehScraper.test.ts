import KhalidAbuhakmehScraper from '../src/scrapers/KhalidAbuhakmehScraper';

import { testScraper } from './helpers';

test('KhalidAbuhakmehScraper', async () => {
  const scraper = new KhalidAbuhakmehScraper();
  await testScraper(scraper);
});
