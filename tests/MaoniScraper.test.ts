import { testScraper } from '../core/testing';
import { MaoniScraper } from '../src/scrapers/MaoniScraper';

test('Maoni', async () => {
  await testScraper(() => new MaoniScraper());
});
