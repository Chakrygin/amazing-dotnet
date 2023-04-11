import { DevBlogsScraperBase } from '../../core/scrapers/shared';

// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import moment from 'moment';

// import { Scraper } from 'core/scrapers';
// import { Post, Link } from 'core/posts';

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
