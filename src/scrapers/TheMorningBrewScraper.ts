import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class TheMorningBrewScraper implements Scraper {
  constructor(
    private readonly knownHosts: readonly string[]) { }

  readonly name = 'TheMorningBrew';
  readonly path = 'blog.cwa.me.uk';

  private readonly blog: Link & Required<Pick<Post, 'author'>> = {
    title: 'The Morning Brew',
    href: 'https://blog.cwa.me.uk',
    author: 'Chris Alcock',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('#content .post').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage();
      const link = article.find('h2.post-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate(article, $);
      const description = this.getDescription(article, $);

      if (!description) {
        core.info('Post is not interesting. Continue scraping.');
        continue;
      }

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
        description,
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
      };

      yield post;
    }
  }
  private getImage(): string {
    const value1 = Math.floor(4 * Math.random());
    const value2 = value1 > 0 ? value1.toString() : '';

    return `https://blog.cwa.me.uk/wp-content/themes/Hackedcoffeespot2/img/header${value2}.jpg`;
  }

  private getDate(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string {
    const date = $(article)
      .find('.day-date em:nth-of-type(2)')
      .text()
      .replace(/^\w+\s/, '')
      .replace(/(\d+)\w+/, '$1')
      .replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3');

    return date;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] | undefined {
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
