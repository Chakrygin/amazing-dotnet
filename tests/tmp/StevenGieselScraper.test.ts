import { testScraper } from '../core/testing';
import { StevenGieselScraper } from '../src/scrapers/StevenGieselScraper';

test('RadioDotNet', async () => {
  await testScraper(() => new StevenGieselScraper());
});
