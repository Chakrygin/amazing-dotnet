import { testScraper } from '@core/testing';

import { DevBlogsScraper } from '@src/scrapers/DevBlogsScraper';

test('DevBlogs / .NET Blog', async () => {
  await testScraper(() => new DevBlogsScraper('dotnet'));
});

test('DevBlogs / TypeScript', async () => {
  await testScraper(() => new DevBlogsScraper('typescript'));
});

test('DevBlogs / Visual Studio Blog', async () => {
  await testScraper(() => new DevBlogsScraper('visualstudio'));
});

test('DevBlogs / Windows Command Line', async () => {
  await testScraper(() => new DevBlogsScraper('commandline'));
});
