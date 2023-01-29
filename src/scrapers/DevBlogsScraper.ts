import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

const Blogs = {
  'dotnet': '.NET Blog',
  'odata': 'OData',
  'nuget': 'The NuGet Blog',
  'visualstudio': 'Visual Studio Blog',
};

export default class DevBlogsScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof Blogs) { }

  readonly name = `DevBlogs / ${Blogs[this.id]}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly blogs: Link = {
    title: 'DevBlogs',
    href: 'https://devblogs.microsoft.com',
  };

  private readonly blog: Link = {
    title: Blogs[this.id],
    href: `https://devblogs.microsoft.com/${this.id}/`,
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const entries = $('#main .entry-box').toArray();

    if (entries.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${entries.length}.`);

    for (let index = 0; index < entries.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const entry = $(entries[index]);
      const image = entry.find('.entry-image img').attr('data-src');
      const link = entry.find('.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = entry.find('.entry-post-date').text();
      const tags = entry
        .find('.post-categories-tags a')
        .map((_, element) => $(element).text())
        .toArray();

      let post: Post = {
        image,
        title,
        href,
        categories: [
          this.blogs,
          this.blog,
        ],
        date: moment(date, 'LL'),
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
        tags,
      };

      post = await this.enrichPost(post);

      yield post;
    }
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);
    const entry = $('#main .entry-content');
    const description = this.getDescription(entry, $);

    post = {
      ...post,
      description,
    };

    return post;
  }

  private getDescription(entry: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];
    const elements = $(entry).children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
        const text = p.text().trim();

        if (text) {
          description.push(text);
        }
      }
      else if (description.length > 0) {
        break
      }
    }

    return description;
  }
}
