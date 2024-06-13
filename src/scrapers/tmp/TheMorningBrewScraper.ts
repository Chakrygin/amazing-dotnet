import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class TheMorningBrewScraper extends HtmlPageScraper {
  constructor(
    private readonly knownHosts: readonly string[]) {
    super();
  }

  readonly name = 'TheMorningBrew';
  readonly path = 'blog.cwa.me.uk';
  readonly author = 'Chris Alcock';

  private readonly TheMorningBrew: Link = {
    title: 'The Morning Brew',
    href: 'https://blog.cwa.me.uk',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.TheMorningBrew.href)
      .fetchPosts(TheMorningBrewFetchReader, reader => {
        const post: Post = {
          image: this.getImage(),
          title: reader.title,
          href: reader.href,
          categories: [
            this.TheMorningBrew,
          ],
          author: this.author,
          date: moment(reader.getDate(), 'LL'),
          description: reader.getDescription(href => this.isKnownHost(href)),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
        };

        if (!post.description) {
          return;
        }

        return post;
      });
  }

  getImage(): string {
    const now = new Date();
    const date1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const date2 = Date.UTC(now.getFullYear(), 0, 0);
    const dayOfYear = (date1 - date2) / 24 / 60 / 60 / 1000;
    const value1 = dayOfYear % 4;
    const value2 = value1 > 0 ? value1.toString() : '';

    return `https://blog.cwa.me.uk/wp-content/themes/Hackedcoffeespot2/img/header${value2}.jpg`;
  }

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }
}

class TheMorningBrewFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = '#content .post';

  readonly link = this.article.find('h2.post-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';

  getDate(): string {
    const date = this.article
      .find('.day-date em:nth-of-type(2)')
      .text()
      .replace(/^\w+\s/, '')
      .replace(/(\d+)\w+/, '$1')
      .replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3');

    return date;
  }

  getDescription(isKnownHost: (href: string) => boolean): string[] | undefined {
    const description = [];
    const elements = this.article
      .find('.post-content>ul>li>a:first-child')
      .toArray();

    for (const element of elements) {
      const link = this.$(element);
      const title = link.text();
      const href = link.attr('href');

      if (title && href && !isKnownHost(href)) {
        description.push(`${title}: ${href}`);

        if (description.length >= 10) {
          break;
        }
      }
    }

    if (description.length > 0) {
      return description;
    }
  }
}
