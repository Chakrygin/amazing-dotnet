import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post } from '../models';

const blogs = {
  'dotnet': '.NET Blog',
  'odata': 'OData',
  'nuget': 'The NuGet Blog',
  'typescript': 'TypeScript',
  'visualstudio': 'Visual Studio Blog',
  'commandline': 'Windows Command Line',
};

export default class DevBlogsScraper extends ScraperBase {
  constructor(
    private readonly id: keyof typeof blogs) {
    super();
  }

  readonly name = `DevBlogs / ${blogs[this.id]}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly blog: Category = {
    title: blogs[this.id],
    href: `https://devblogs.microsoft.com/${this.id}/`,
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const entries = $('#content .entry-box').toArray();

    if (entries.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${entries.length} posts found.`);

    for (let index = 0; index < entries.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const entry = $(entries[index]);
      const image = entry.find('.entry-image img').attr('data-src');
      const title = entry.find('.entry-title a');
      const href = title.attr('href') ?? '';
      const date = entry.find('.entry-post-date').text();
      const description = this.getDescription(entry, $);

      const tags = entry
        .find('.card-tags-links .card-tags-linkbox a')
        .map((_, element) => $(element))
        .toArray();

      const post: Post = {
        image: image,
        title: title.text(),
        href: href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
        description: description,
        links: [
          {
            title: 'Read',
            href: href,
          },
        ],
        tags: tags.map(tag => {
          return {
            title: tag.text(),
            href: tag.attr('href') ?? '',
          };
        }),
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getDescription(entry: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = entry
      .find('.entry-content')
      .contents();

    for (const element of elements) {
      if (element.type == 'text') {
        const text = $(element).text();
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line);

        for (const line of lines) {
          description.push(line);
        }
      }
    }

    return description;
  }
}
