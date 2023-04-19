import { testScraper } from '../core/testing';
import { MichaelsCodingSpotScraper } from '../src/scrapers/MichaelsCodingSpotScraper';

test('Meziantou', async () => {
  await testScraper(() => new MichaelsCodingSpotScraper());
});
