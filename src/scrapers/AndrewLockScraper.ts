import moment from 'moment';
import RssParser from 'rss-parser';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class AndrewLockScraper extends ScraperBase {
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
          item: [
            ['media:content', 'media:content'],
          ],
        },
      })
      .fetchPosts((_, item) => {

        const image = this.getImage(item)
        const title = item.title ?? '';
        const href = item.link ?? '';
        const date = item.isoDate ?? '';
        const description = this.getDescription(item);
        const tags = item.categories;

        return {
          image,
          title,
          href,
          categories: [this.AndrewLock],
          author: this.author,
          date: moment(date),
          description,
          tags,
        };

      });
  }

  private getImage(item: RssParser.Item & { 'media:content': unknown }): string | undefined {
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

  getDescription(item: RssParser.Item): string[] {
    let description = item.contentSnippet?.trim() ?? '';

    if (!description.endsWith('.')) {
      description += '.';
    }

    return [description];
  }
}
