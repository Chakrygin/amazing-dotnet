import { testScraper } from '@core/testing';
import { StevenGieselScraper } from '@src/scrapers/StevenGieselScraper';

test('StevenGiesel', async () => {
  await testScraper(() => new StevenGieselScraper());
});
