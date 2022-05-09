import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Message, Source } from '../models';

const blogs = {
  'dotnet': '.NET Blog',
  'odata': 'OData',
  'nuget': 'The NuGet Blog',
  'typescript': 'TypeScript',
  'visualstudio': 'Visual Studio Blog',
  'commandline': 'Windows Command Line',
};

export default class DevBlogsScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof blogs) { }

  readonly name = `DevBlogs / ${blogs[this.id]}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly source: Source = {
    title: blogs[this.id],
    href: `https://devblogs.microsoft.com/${this.id}/`,
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.href, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Message & Required<Pick<Message, 'date'>>, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
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
      const author = entry.find('.entry-author-link a');
      const date = entry.find('.entry-post-date').text();
      const description = this.getDescription(entry, $);

      const tags = entry
        .find('.card-tags-links .card-tags-linkbox a')
        .map((_, element) => $(element))
        .toArray();

      const post: Message & Required<Pick<Message, 'date'>> = {
        image: image,
        title: title.text().trim(),
        href: title.attr('href') ?? '',
        source: this.source,
        author: {
          title: author.text().trim(),
          href: author.attr('href') ?? '',
        },
        date: moment(date, 'LL'),
        description: description,
        tags: tags.map(tag => {
          return {
            title: tag.text().trim(),
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
