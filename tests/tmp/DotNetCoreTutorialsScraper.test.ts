import { testScraper } from '../core/testing';
import { DotNetCoreTutorialsScraper } from '../src/scrapers/DotNetCoreTutorialsScraper';

test('DotNetCoreTutorials', async () => {
  await testScraper(() => new DotNetCoreTutorialsScraper());
});
