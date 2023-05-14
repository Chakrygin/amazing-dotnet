import { testScraper } from '../core/testing';
import { HaackedScraper } from '../src/scrapers/HaackedScraper';

test('Haacked', async () => {
  await testScraper(() => new HaackedScraper());
});
