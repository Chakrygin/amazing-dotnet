import { testScraper } from 'core/testing';

import EnterpriseCraftsmanshipScraper from '../src/scrapers/EnterpriseCraftsmanshipScraper';

test('EnterpriseCraftsmanship', async () => {
  await testScraper(() => new EnterpriseCraftsmanshipScraper());
});
