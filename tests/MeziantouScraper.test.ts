import { testScraper } from '@core/testing';

import { MeziantouScraper } from '@src/scrapers/MeziantouScraper';

test('Meziantou', async () => {
  await testScraper(() => new MeziantouScraper());
});
