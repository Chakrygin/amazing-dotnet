import HabrScraper from '../src/scrapers/HabrScraper';

import { testScraper } from './helpers';

test('Habr', async () => {
  const scraper = new HabrScraper();
  await testScraper(scraper);
});
