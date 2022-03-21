import * as core from '@actions/core';

import RssParser from 'rss-parser';

import { ScraperOptions, ScraperBase } from "./base";
import { Sender } from "../abstractions";
import { Post, Blog, Author, Tag } from '../models';
import { validatePost } from '../validators';

export interface AndrewLockOptions extends ScraperOptions {
  readonly blog: Blog;
  readonly author: Author;
}

export class AndrewLockScraper extends ScraperBase<AndrewLockOptions>{
  protected async scrapeInternal(sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (this.storage.has(post.date, post.link)) {
        break;
      }

      await sender.sendPost(post);

      this.storage.add(post.date, post.link);
    }
  }

  private async *readPosts(): AsyncGenerator<Post> {
    const feedUrl = this.options.blog.link + 'rss.xml';
    core.info(`Download rss feed by url '${feedUrl}'.`);

    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    const feed = await parser.parseURL(feedUrl);

    if (feed.items.length == 0) {
      throw new Error('Failed to parse rss feed. No posts found.');
    }

    for (let index = 0; index < feed.items.length; index++) {
      core.info(`Parse post at index ${index}.`);
      const item = feed.items[index];

      const post: Post = {
        title: item.title ?? '',
        link: item.link ?? '',
        image: this.getImage(item['media:content']),
        date: new Date(item.isoDate ?? ''),
        blog: this.options.blog,
        author: this.options.author,
        description: [this.getDescription(item.contentSnippet)],
        tags: this.getTags(item.categories),
      };

      validatePost(post);

      yield post;
    }
  }

  private getImage(content: any): string {
    const image = content['$'];

    if (image && image.url && image.medium === 'image') {
      return image.url;
    }

    return '';
  }

  private getDescription(content: string | undefined): string {
    if (content) {
      if (!content.endsWith('.')) {
        content = content + '.'
      }

      return content;
    }

    return '';
  }

  private getTags(categories: string[] | undefined): Tag[] {
    const tags: Tag[] = [];

    if (categories) {
      for (const category of categories) {
        const slug = category
          .toLocaleLowerCase()
          .replace(/^[^a-z0-9-]+/g, '')
          .replace(/[^a-z0-9-]+$/g, '')
          .replace(/[^a-z0-9-]+/g, '-');

        tags.push({
          title: category,
          link: `${this.options.blog.link}tag/${slug}/`,
        });
      }
    }

    return tags;
  }
}
