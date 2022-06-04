import * as core from '@actions/core';

import moment from 'moment';
import RssParser from 'rss-parser';

import ScraperBase from './ScraperBase';

import { Category, Post, Tag } from '../models';

export default class AndrewLockScraper extends ScraperBase {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';

  private readonly blog: Category = {
    title: '.NET Escapades',
    href: 'https://andrewlock.net/',
  };

  private readonly author: Category = {
    title: 'Andrew Lock',
    href: 'https://andrewlock.net/about/',
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing rss feed by url '${this.blog.href}rss.xml'...`);

    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    const feed = await parser.parseURL(this.blog.href + 'rss.xml');

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

      const post: Post = {
        image: image,
        title: item.title ?? '',
        href: item.link ?? '',
        categories: [
          this.blog,
          this.author,
        ],
        date: moment(item.isoDate),
        description: [
          description,
          `Read: ${item.link}`,
        ],
        tags: tags,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(item: { 'media:content': unknown }): string | undefined {
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

  private getDescription(item: RssParser.Item): string {
    let description = item.contentSnippet?.trim() ?? '';
    if (!description.endsWith('.')) {
      description += '.';
    }

    return description;
  }

  private getTags(item: RssParser.Item): Tag[] | undefined {
    if (item.categories && item.categories.length > 0) {
      const tags = [];

      for (const category of item.categories) {
        const slug = category
          .toLocaleLowerCase()
          .replace(/^[^a-z0-9]+/g, '')
          .replace(/[^a-z0-9]+$/g, '')
          .replace(/[^a-z0-9]+/g, '-');

        const tag: Tag = {
          title: category,
          href: `${this.blog.href}tag/${slug}/`,
        };

        tags.push(tag);
      }

      return tags;
    }
  }
}
