import HabrScraper from '../src/scrapers/HabrScraper';

import { testScraper } from './helpers';

test('HabrScraper', async () => {
  const scraper = new HabrScraper();
  await testScraper(scraper);
});
