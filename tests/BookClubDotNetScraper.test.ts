import BookClubDotNetScraper from '../src/scrapers/BookClubDotNetScraper';

import { testScraper } from './helpers';

test('BookClubDotNet', async () => {
  const scraper = new BookClubDotNetScraper();
  await testScraper(scraper);
});
