import { testScraper } from 'core/testing';

import KhalidAbuhakmehScraper from '../src/scrapers/KhalidAbuhakmehScraper';

test('KhalidAbuhakmeh', async () => {
  await testScraper(() => new KhalidAbuhakmehScraper());
});
