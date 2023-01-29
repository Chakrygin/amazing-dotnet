import { testScraper } from 'core/testing';

import HabrScraper from '../src/scrapers/HabrScraper';

test('Habr / C#', async () => {
  await testScraper(() => new HabrScraper('csharp'));
});

test('Habr / F#', async () => {
  await testScraper(() => new HabrScraper('fsharp'));
});

test('Habr / .NET', async () => {
  await testScraper(() => new HabrScraper('net'));
});
