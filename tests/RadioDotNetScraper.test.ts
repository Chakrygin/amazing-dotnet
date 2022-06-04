import RadioDotNetScraper from '../src/scrapers/RadioDotNetScraper';

import { testScraper } from './helpers';

test('RadioDotNet', async () => {
  const scraper = new RadioDotNetScraper();
  await testScraper(scraper);
});
