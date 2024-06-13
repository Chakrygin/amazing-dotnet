import { testScraper } from '../core/testing';
import { RadioDotNetScraper } from '../src/scrapers/RadioDotNetScraper';

test('RadioDotNet', async () => {
  await testScraper(() => new RadioDotNetScraper());
});
