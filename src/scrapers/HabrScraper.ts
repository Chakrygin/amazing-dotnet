import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Category, Message, Source, Tag } from '../models';

type HabrMessage = Message & Required<Pick<Message, 'date'>> & {
  readonly rating: number;
};

export default class HabrScraper implements Scraper {
  readonly name = 'Habr';
  readonly path = 'habr.com';

  private readonly source: Source = {
    title: 'Хабр',
    href: 'https://habr.com/ru/hub/net/',
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (post.rating < 10) {
        core.info('Post rating is too low. Continue scraping.');
        continue;
      }

      if (storage.has(post.href, post.date)) {
        core.info('Post already exists in storage. Continue scraping.');
        continue;
      }

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<HabrMessage, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data);
    const articles = $('.tm-articles-list article.tm-articles-list__item').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('a.tm-article-snippet__title-link');
      const author = article.find('.tm-article-snippet__author a.tm-user-info__username');
      const date = article.find('.tm-article-snippet__datetime-published time').attr('datetime') ?? '';
      const description = this.getDescription(article, $);
      const [categories, tags] = this.getCategoriesAndTags(article, $);
      const rating = article.find('.tm-votes-meter__value').text();

      const post: HabrMessage = {
        image: image,
        title: title.text().trim(),
        href: this.getFullHref(title.attr('href')) ?? '',
        source: this.source,
        author: {
          title: author.text().trim(),
          href: this.getFullHref(author.attr('href')) ?? '',
        },
        categories: categories,
        date: moment(date).locale('ru'),
        description: description,
        tags: tags,
        rating: parseInt(rating),
      };

      if (isNaN(post.rating)) {
        throw new Error('Failed to parse post. Rating is invalid.');
      }

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const src =
      article.find('.tm-article-snippet__cover img').attr('src') ??
      article.find('.article-formatted-body img').attr('src');

    return src;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string | string[] | undefined {
    const body = article.find('.article-formatted-body');
    if (body.hasClass('article-formatted-body_version-1')) {
      return body.text();
    }
    else if (body.hasClass('article-formatted-body_version-2')) {
      const description = new Array<string>();

      const elements = body.children();
      for (const element of elements) {
        if (element.name == 'p') {
          const text = $(element).text().trim();
          if (text) {
            description.push(text);
          }
        }
        else {
          break;
        }
      }

      return description;
    }
  }

  private getCategoriesAndTags(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): [Category[] | undefined, Tag[] | undefined] {
    const hubs = article
      .find('.tm-article-snippet__hubs .tm-article-snippet__hubs-item a')
      .map((_, element) => $(element));

    let categories: Category[] | undefined;
    let tags: Tag[] | undefined;

    for (const hub of hubs) {
      const title = hub.text().replace('*', '').trim();
      const href = this.getFullHref(hub.attr('href')) ?? '';

      if (title.startsWith('Блог компании')) {
        if (!categories) {
          categories = [];
        }

        categories.push({ title, href });
      }
      else if (title !== '.NET') {
        if (!tags) {
          tags = [];
        }

        tags.push({ title, href });
      }
    }

    return [categories, tags];
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href && href.startsWith('/')) {
      href = 'https://habr.com' + href;
    }

    return href;
  }
}
