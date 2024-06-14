import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class TheMorningBrewScraper extends ScraperBase {
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
      .fetchPosts('#content .post', ($, element) => {

        const image = this.getImage();
        const link = element.find('h2.post-title a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = this.getDate(element);
        const description = this.getDescription($, element);

        if (!description) {
          return;
        }

        return {
          image,
          title,
          href,
          categories: [this.TheMorningBrew],
          author: this.author,
          date: moment(date, 'LL'),
          description,
        };

      });
  }

  private getImage(): string {
    const now = new Date();
    const date1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const date2 = Date.UTC(now.getFullYear(), 0, 0);
    const dayOfYear = (date1 - date2) / 24 / 60 / 60 / 1000;
    const value1 = dayOfYear % 4;
    const value2 = value1 > 0 ? value1.toString() : '';

    return `https://blog.cwa.me.uk/wp-content/themes/Hackedcoffeespot2/img/header${value2}.jpg`;
  }

  private getDate(element: cheerio.Cheerio<cheerio.Element>): string {
    const date = element
      .find('.day-date em:nth-of-type(2)')
      .text()
      .replace(/^\w+\s/, '')
      .replace(/(\d+)\w+/, '$1')
      .replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3');

    return date;
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] | undefined {
    const description = [];
    const links = element
      .find('.post-content>ul>li>a:first-child')
      .map((_, link) => $(link));

    for (const link of links) {
      const title = link.text();
      const href = link.attr('href');

      if (title && href && !this.isKnownHost(href)) {
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

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }
}
