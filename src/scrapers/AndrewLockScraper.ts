import * as core from '@actions/core';

import moment from 'moment';
import RssParser from 'rss-parser';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Author, Message, Source, Tag } from '../models';

export default class AndrewLockScraper implements Scraper {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';

  private readonly source: Source = {
    title: '.NET Escapades',
    href: 'https://andrewlock.net/',
  };

  private readonly author: Author = {
    title: 'Andrew Lock',
    href: 'https://andrewlock.net/about/',
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
    core.info(`Parsing rss feed by url '${this.source.href}rss.xml'...`);

    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    const feed = await parser.parseURL(this.source.href + 'rss.xml');

    if (feed.items.length == 0) {
      throw new Error('Failed to parse rss feed. No posts found.');
    }

    core.info(`Rss feed parsed. ${feed.items.length} posts found.`);

    for (let index = 0; index < feed.items.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const item = feed.items[index];
      const image = this.getImage(item);
      const description = this.getDescription(item);
      const tags = this.getTags(item);

      const post: Message & Required<Pick<Message, 'date'>> = {
        image: image,
        title: item.title ?? '',
        href: item.link ?? '',
        source: this.source,
        author: this.author,
        date: moment(item.isoDate),
        description: description,
        tags: tags,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(item: { 'media:content': any }): string | undefined {
    interface MediaContent {
      readonly $: {
        readonly medium: string;
        readonly url: string;
      }
    }

    const content = item['media:content'] as MediaContent;
    if (content.$.medium === 'image') {
      return content.$.url;
    }
  }

  private getDescription(item: RssParser.Item): string | undefined {
    let description = item.contentSnippet?.trim();
    if (description && !description.endsWith('.')) {
      description += '.';
    }

    return description;
  }

  private getTags(item: RssParser.Item): Tag[] | undefined {
    if (item.categories && item.categories.length > 0) {
      const tags = new Array<Tag>();

      for (const category of item.categories) {
        const slug = category
          .toLocaleLowerCase()
          .replace(/^[^a-z0-9]+/g, '')
          .replace(/[^a-z0-9]+$/g, '')
          .replace(/[^a-z0-9]+/g, '-');

        const tag: Tag = {
          title: category,
          href: `${this.source.href}tag/${slug}/`,
        };

        tags.push(tag);
      }

      return tags;
    }
  }
}
