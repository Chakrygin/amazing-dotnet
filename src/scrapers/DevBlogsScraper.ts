import { DevBlogsScraperBase } from '@core/scrapers/shared';

const blogs = {
  'dotnet': '.NET Blog',
  'typescript': 'TypeScript',
  'visualstudio': 'Visual Studio Blog',
  'commandline': 'Windows Command Line',
};

export class DevBlogsScraper extends DevBlogsScraperBase {
  constructor(id: keyof typeof blogs) {
    super(id, blogs[id]);
  }
}
