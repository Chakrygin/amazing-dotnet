import { testScraper } from '../core/testing';
import { JetBrainsScraper } from '../src/scrapers/JetBrainsScraper';

test('JetBrains / How-To\'s', async () => {
  await testScraper(() => new JetBrainsScraper('how-tos'));
});

test('JetBrains / Releases', async () => {
  await testScraper(() => new JetBrainsScraper('releases'));
});

test('JetBrains / .NET Annotated', async () => {
  await testScraper(knownHosts => new JetBrainsScraper('net-annotated', knownHosts));
});
