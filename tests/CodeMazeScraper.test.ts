import { testScraper } from '@core/testing';

import { CodeMazeScraper } from '@src/scrapers/CodeMazeScraper';

test('CodeMaze', async () => {
  await testScraper(knownHosts => new CodeMazeScraper(knownHosts));
});
