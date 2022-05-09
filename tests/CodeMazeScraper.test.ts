import CodeMazeScraper from '../src/scrapers/CodeMazeScraper';

import { testScraper } from './helpers';

test('CodeMaze', async () => {
  const scraper = new CodeMazeScraper();
  await testScraper(scraper);
});
