import { testScraper } from '../core/testing';
import { CodeOpinionScraperV2 } from '../src/scrapers/CodeOpinionScraperV2';

test('CodeOpinion', async () => {
  await testScraper(() => new CodeOpinionScraperV2());
});
