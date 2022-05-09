import CodeMazeScraper from '../src/scrapers/CodeMazeScraper';

import { testScraper } from './helpers';

test('CodeMazeScraper', async () => {
  const scraper = new CodeMazeScraper();
  await testScraper(scraper);
});
