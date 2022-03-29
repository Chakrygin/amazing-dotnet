import RssParser from 'rss-parser';

import { Scraper } from "./abstractions";
import { Sender } from "../senders/abstractions";
import { Storage } from "../storage";
import { Author, Blog, Post, Tag } from "../models";

export class AndrewLockScraper implements Scraper {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';

  private readonly blog: Blog = {
    title: '.NET Escapades',
    link: 'https://andrewlock.net/'
  }

  private readonly author: Author = {
    title: 'Andrew Lock',
    link: 'https://andrewlock.net/about/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        break;
      }

      await sender.sendPost(post);

      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    const feedUrl = this.blog.link + 'rss.xml';
    console.log(`Download rss feed by url '${feedUrl}'.`);

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
      console.log(`Parse post at index ${index}.`);

      const item = feed.items[index];
      const image = this.getImage(item['media:content']);
      const description = this.getDescription(item.contentSnippet);
      const tags = this.getTags(item.categories);

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

      yield post;
    }
  }

  private getImage(content: any): string {
    if (content) {
      const image = content['$'];
      if (image && image.url && image.medium === 'image') {
        return image.url;
      }
    }

    return '';
  }

  private getDescription(content: string | undefined): string {
    if (content && !content.endsWith('.')) {
      content += '.'
    }

    return content ?? '';
  }

  private getTags(categories: string[] | undefined): Tag[] {
    const tags = new Array<Tag>();

    if (categories && categories.length > 0) {
      for (const category of categories) {
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
    }

    return tags;
  }
}
