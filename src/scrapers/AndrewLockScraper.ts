import * as core from '@actions/core';

import moment from 'moment';
import RssParser from 'rss-parser';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class AndrewLockScraper implements Scraper {

  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';

  private readonly blog: Link & Required<Pick<Post, 'author'>> = {
    title: '.NET Escapades',
    href: 'https://andrewlock.net',
    author: 'Andrew Lock',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing rss feed by url '${this.blog.href}/rss.xml'...`);

    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    const feed = await parser.parseURL(this.blog.href + '/rss.xml');

    if (feed.items.length == 0) {
      throw new Error('Failed to parse rss feed. No posts found.');
    }

    core.info(`Rss feed parsed. Number of posts found is ${feed.items.length}.`);

    for (let index = 0; index < feed.items.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const item = feed.items[index];
      const image = this.getImage(item);
      const description = this.getDescription(item);

      const post: Post = {
        image,
        title: item.title ?? '',
        href: item.link ?? '',
        categories: [
          this.blog,
        ],
        author: this.blog.author,
        date: moment(item.isoDate),
        description: [
          description,
        ],
        links: [
          {
            title: 'Read more',
            href: item.link ?? '',
          }
        ],
        tags: item.categories,
      };

      yield post;
    }
  }

  private getImage(item: { 'media:content': unknown }): string | undefined {
    const content = item['media:content'] as {
      readonly $: {
        readonly medium: string;
        readonly url: string;
      }
    };

    if (content.$.medium === 'image') {
      return content.$.url;
    }
  }

  private getDescription(item: RssParser.Item): string {
    let description = item.contentSnippet?.trim() ?? '';
    if (!description.endsWith('.')) {
      description += '.';
    }

    return description;
  }
}
