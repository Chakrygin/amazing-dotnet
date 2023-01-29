import { testScraper } from 'core/testing';

import CodeOpinionScraper from '../src/scrapers/CodeOpinionScraper';

test('CodeOpinion', async () => {
  await testScraper(() => new CodeOpinionScraper());
});
