import { testScraper } from '@core/testing';

import { JetBrainsBlogScraper } from '@src/scrapers/JetBrainsBlogScraper';

test('JetBrains / How-To\'s', async () => {
  await testScraper(() => new JetBrainsBlogScraper('how-tos'));
});

test('JetBrains / Releases', async () => {
  await testScraper(() => new JetBrainsBlogScraper('releases'));
});

test('JetBrains / dotInsights', async () => {
  await testScraper(knownHosts => new JetBrainsBlogScraper('dotinsights', knownHosts));
});
