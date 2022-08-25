import MeziantouScraper from '../src/scrapers/MeziantouScraper';

import { testScraper } from './helpers';

test('KhalidAbuhakmeh', async () => {
  const scraper = new MeziantouScraper();
  await testScraper(scraper);
});
