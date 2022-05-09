import DevBlogsScraper from '../src/scrapers/DevBlogsScraper';

import { testScraper } from './helpers';

test('DevBlogs / .NET Blog', async () => {
  const scraper = new DevBlogsScraper('dotnet');
  await testScraper(scraper);
});
