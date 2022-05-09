import DotNetCoreTutorialsScraper from '../src/scrapers/DotNetCoreTutorialsScraper';

import { testScraper } from './helpers';

test('DotNetCoreTutorials', async () => {
  const scraper = new DotNetCoreTutorialsScraper();
  await testScraper(scraper);
});
