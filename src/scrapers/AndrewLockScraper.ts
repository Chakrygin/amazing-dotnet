import moment from 'moment';
import RssParser from 'rss-parser';

import { Link, Post } from '../../core/models';
import { RssFeedScraper } from '../../core/scrapers';

export class AndrewLockScraper extends RssFeedScraper {
  readonly name = 'AndrewLock';
  readonly path = 'andrewlock.net';
  readonly author = 'Andrew Lock';

  private readonly AndrewLock: Link = {
    title: '.NET Escapades',
    href: 'https://andrewlock.net',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromRssFeed(this.AndrewLock.href + '/rss.xml', {
        customFields: {
          item: ['media:content', 'media:content', { keepArray: true }],
        },
      })
      .fetchPosts(AndrewLockFetchReader, reader => {
        const post: Post = {
          image: reader.getImage(),
          title: reader.title,
          href: reader.href,
          categories: [
            this.AndrewLock,
          ],
          author: this.author,
          date: moment(reader.date),
          description: reader.getDescription(),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
          tags: reader.tags,
        };

        return post;
      });
  }
}

class AndrewLockFetchReader<T extends { 'media:content': unknown }> {
  constructor(
    private readonly feed: RssParser.Output<T>,
    private readonly item: RssParser.Item & T) { }

  readonly title = this.item.title ?? '';
  readonly href = this.item.link ?? '';
  readonly date = this.item.isoDate ?? '';
  readonly tags = this.item.categories;

  getImage(): string | undefined {
    const content = this.item['media:content'] as {
      readonly $: {
        readonly medium: string;
        readonly url: string;
      };
    };

    if (content.$.medium === 'image') {
      return content.$.url;
    }
  }

  getDescription(): string[] {
    let description = this.item.contentSnippet?.trim() ?? '';

    if (!description.endsWith('.')) {
      description += '.';
    }

    return [description];
  }
}
