import CodeOpinionScraper from '../src/scrapers/CodeOpinionScraper';

import { testScraper } from './helpers';

test('CodeOpinion', async () => {
  const scraper = new CodeOpinionScraper();
  await testScraper(scraper);
});
