import { testScraper } from '@core/testing';

import { BreslavLozhechkinScraper } from '@src/scrapers/BreslavLozhechkinScraper';

test('BreslavLozhechkin', async () => {
  await testScraper(() => new BreslavLozhechkinScraper());
});
