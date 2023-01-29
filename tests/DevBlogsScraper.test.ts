import { testScraper } from 'core/testing';

import DevBlogsScraper from '../src/scrapers/DevBlogsScraper';

test('DevBlogs / .NET Blog', async () => {
  await testScraper(() => new DevBlogsScraper('dotnet'));
});

test('DevBlogs / OData', async () => {
  await testScraper(() => new DevBlogsScraper('odata'));
});

test('DevBlogs / The NuGet Blog', async () => {
  await testScraper(() => new DevBlogsScraper('nuget'));
});

test('DevBlogs / Visual Studio Blog', async () => {
  await testScraper(() => new DevBlogsScraper('visualstudio'));
});
