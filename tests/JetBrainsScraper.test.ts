import JetBrainsScraper from '../src/scrapers/JetBrainsScraper';

import { testScraper } from './helpers';

test('JetBrains / How-To\'s', async () => {
  const scraper = new JetBrainsScraper('how-tos');
  await testScraper(scraper);
});

test('JetBrains / Releases', async () => {
  const scraper = new JetBrainsScraper('releases');
  await testScraper(scraper);
});

test('JetBrains / .NET Annotated', async () => {
  const scraper = new JetBrainsScraper('net-annotated');
  await testScraper(scraper);
});
