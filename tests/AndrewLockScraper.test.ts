import { testScraper } from '@core/testing';

import { AndrewLockScraper } from '@src/scrapers/AndrewLockScraper';

test('AndrewLock', async () => {
  await testScraper(() => new AndrewLockScraper());
});
