import { testScraper } from '../core/testing';
import { MichaelsCodingSpotScraper } from '../src/scrapers/MichaelsCodingSpotScraper';

test('MichaelsCodingSpot', async () => {
  await testScraper(() => new MichaelsCodingSpotScraper());
});
