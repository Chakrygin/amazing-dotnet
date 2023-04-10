import moment from 'moment';
import RssParser from 'rss-parser';

import { Link, Post } from '../../core/models';
import { RssFeedScraper } from '../../core/scrapers';

export class AndrewLockScraper extends RssFeedScraper {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';
  readonly author = 'Andrew Lock';

  private readonly blog: Link = {
    title: '.NET Escapades',
    href: 'https://andrewlock.net',
  };

  protected readPosts(): AsyncGenerator<Post> {
    const parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:content', { keepArray: true }],
      },
    });

    return this.readPostsFromRssFeed(parser, this.blog.href + '/rss.xml', (feed, item) => {
      const image = this.getImage(item);
      const description = this.getDescription(item);

      const post: Post = {
        image,
        title: item.title ?? '',
        href: item.link ?? '',
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(item.isoDate),
        description: description,
        links: [
          {
            title: 'Read more',
            href: item.link ?? '',
          },
        ],
        tags: item.categories,
      };

      return post;
    });
  }

  private getImage(item: { 'media:content': unknown }): string | undefined {
    const content = item['media:content'] as {
      readonly $: {
        readonly medium: string;
        readonly url: string;
      };
    };

    if (content.$.medium === 'image') {
      return content.$.url;
    }
  }

  private getDescription(item: RssParser.Item): string[] {
    let description = item.contentSnippet?.trim() ?? '';
    if (!description.endsWith('.')) {
      description += '.';
    }

    return [description];
  }
}
