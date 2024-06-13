import { DevBlogsScraperBase } from '../../core/scrapers/shared';

const Blogs = {
  'dotnet': '.NET Blog',
  'odata': 'OData',
  'nuget': 'The NuGet Blog',
  'typescript': 'TypeScript',
  'visualstudio': 'Visual Studio Blog',
  'commandline': 'Windows Command Line',
};

export class DevBlogsScraper extends DevBlogsScraperBase {
  constructor(blogId: keyof typeof Blogs) {
    super(blogId, Blogs[blogId]);
  }
}
