import DotNetCoreTutorialsScraper from '../src/scrapers/DotNetCoreTutorialsScraper';

import { testScraper } from './helpers';

test('DotNetCoreTutorialsScraper', async () => {
  const scraper = new DotNetCoreTutorialsScraper();
  await testScraper(scraper);
});
