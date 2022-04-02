import * as core from '@actions/core';

import RssParser from 'rss-parser';

import { Scraper } from "../scrapers";
import { Sender } from "../senders";
import { Storage } from "../storage";
import { Author, Blog, Post, Tag } from "../models";

export class AndrewLockScraper implements Scraper {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';

  private readonly blog: Blog = {
    title: '.NET Escapades',
    link: 'https://andrewlock.net/'
  };

  private readonly author: Author = {
    title: 'Andrew Lock',
    link: 'https://andrewlock.net/about/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.sendPost(post);

      core.info('Storing post...');
      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing rss feed by url '${this.blog.link}rss.xml'...`);

    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    const feed = await parser.parseURL(this.blog.link + 'rss.xml');

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
        link: item.link ?? '',
        blog: this.blog,
        author: this.author,
        date: new Date(item.isoDate ?? ''),
        description: description,
        tags: tags,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

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
      description += '.'
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

        tags.push({
          title: category,
          link: `${this.blog.link}tag/${slug}/`,
        });
      }

      return tags;
    }
  }
}
