import { testScraper } from 'core/testing';

import TheMorningBrewScraper from '../src/scrapers/TheMorningBrewScraper';

test('TheMorningBrew', async () => {
  await testScraper(knownHosts => new TheMorningBrewScraper(knownHosts));
});
