import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper, ScraperBehaviour } from 'core/scrapers';
import { Post, Link } from 'core/posts';

const MIN_RATING = 10;

const Hubs = {
  'csharp': 'C#',
  'fsharp': 'F#',
  'net': '.NET',
};

export default class HabrScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof Hubs) { }

  readonly name = `Habr / ${Hubs[this.id]}`;
  readonly path = 'habr.com';
  readonly behaviour = ScraperBehaviour.ContinueIfPostExists;

  private readonly habr: Link = {
    title: 'Хабр',
    href: 'https://habr.com',
  };

  async *scrape(): AsyncGenerator<Post> {
    const href = `https://habr.com/ru/hub/${this.id}/`;

    core.info(`Parsing html page by url '${href}'...`);

    const response = await axios.get(href);
    const $ = cheerio.load(response.data as string);
    const articles = $('.tm-articles-list article.tm-articles-list__item').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const rating = parseInt(article.find('.tm-votes-meter__value').text());

      if (isNaN(rating)) {
        throw new Error('Failed to parse post. Rating is NaN.');
      }

      if (rating < MIN_RATING) {
        core.info('Post rating is too low. Continue scraping.');
        continue;
      }

      const image = this.getImage(article);
      const link = article.find('a.tm-title__link');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('.tm-article-datetime-published time').attr('datetime') ?? '';
      const [categories, tags] = this.getCategoriesAndTags(article, $);
      const description = this.getDescription(article, $);

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.habr,
          ...categories,
        ],
        date: moment(date).locale('ru'),
        description,
        links: [
          {
            title: 'Читать дальше',
            href: href,
          }
        ],
        tags,
      };

      yield post;
    }
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.habr.href + href;
    }

    return href;
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const src =
      article.find('img.tm-article-snippet__lead-image').attr('src') ??
      article.find('.article-formatted-body p:first-child img:first-child').attr('src');

    return src;
  }

  private getCategoriesAndTags(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): [Link[], string[]] {
    const categories: Link[] = [];
    const tags: string[] = [];

    const elements = article
      .find('.tm-article-snippet__hubs .tm-article-snippet__hubs-item a')
      .map((_, element) => $(element));

    for (const element of elements) {
      const title = element.text().replace('*', '');
      const href = this.getFullHref(element.attr('href')) ?? '';

      if (title.startsWith('Блог компании')) {
        categories.push({ title, href });
      }
      else {
        tags.push(title);
      }
    }

    return [categories, tags];
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const body = article.find('.article-formatted-body');
    if (body.hasClass('article-formatted-body_version-1')) {
      const lines = body.text().split('\n')
        .map(line => line.trim())
        .filter(line => !!line);

      for (const line of lines) {
        description.push(line);
      }
    }
    else if (body.hasClass('article-formatted-body_version-2')) {
      const elements = body.children();
      for (const element of elements) {
        if (element.name == 'p') {
          const line = $(element).text().trim();
          if (line) {
            description.push(line);
          }
        }
        else {
          break;
        }
      }
    }

    return description;
  }
}
