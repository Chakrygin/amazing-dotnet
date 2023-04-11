import * as core from '@actions/core';

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

  private readonly blog: Link = {
    title: 'The Morning Brew',
    href: 'https://blog.cwa.me.uk',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#content .post', ($, article) => {
      const image = this.getImage();
      const link = article.find('h2.post-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate($, article);
      const description = this.getDescription($, article);

      if (!description) {
        core.info('Post is not interesting. Continue scraping.');
        return;
      }

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(date, 'LL'),
        description,
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
      };

      return post;
    });
  }

  private getImage(): string {
    const value1 = Math.floor(4 * Math.random());
    const value2 = value1 > 0 ? value1.toString() : '';

    return `https://blog.cwa.me.uk/wp-content/themes/Hackedcoffeespot2/img/header${value2}.jpg`;
  }

  private getDate($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string {
    const date = $(article)
      .find('.day-date em:nth-of-type(2)')
      .text()
      .replace(/^\w+\s/, '')
      .replace(/(\d+)\w+/, '$1')
      .replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3');

    return date;
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] | undefined {
    const description: string[] = [];

    const elements = $(article)
      .find('.post-content>ul>li>a:first-child')
      .toArray();

    for (const element of elements) {
      const link = $(element);
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
