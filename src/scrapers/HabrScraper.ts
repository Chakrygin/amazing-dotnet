import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Category, Post, Tag } from '../models';

type HabrPost = Post & {
  readonly rating: number;
};

export default class HabrScraper implements Scraper {
  readonly name = 'Habr';
  readonly path = 'habr.com';

  private readonly blog: Category = {
    title: 'Хабр',
    href: 'https://habr.com/ru/hub/net/',
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (post.rating < 10) {
        core.info('Post rating is too low. Continue scraping.');
        continue;
      }

      if (storage.has(post.href)) {
        core.info('Post already exists in storage. Continue scraping.');
        continue;
      }

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href);
    }
  }

  private async *readPosts(): AsyncGenerator<HabrPost, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const articles = $('.tm-articles-list article.tm-articles-list__item').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);

      if (article.find('> .tm-megapost-snippet').length) {
        // TODO: Implement megapost parsing...
        continue;
      }

      const image = this.getImage(article);
      const title = article.find('a.tm-article-snippet__title-link');
      const titleText = title.text();
      const href = this.getFullHref(title.attr('href')) ?? '';
      const date = article.find('.tm-article-snippet__datetime-published time').attr('datetime') ?? '';
      const [categories, tags] = this.getCategoriesAndTags(article, $);
      const maxDescriptionLength = image
        ? this.getMaxDescriptionLength(titleText, href, categories, tags)
        : undefined;
      const description = this.getDescription(article, $, maxDescriptionLength);
      const rating = article.find('.tm-votes-meter__value').text();

      const post: HabrPost = {
        image: image,
        title: titleText,
        href: href,
        categories: [
          this.blog,
          ...categories,
        ],
        date: moment(date).locale('ru'),
        description: description,
        links: [
          {
            title: 'Читать',
            href: href,
          }
        ],
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
      article.find('img.tm-article-snippet__lead-image').attr('src') ??
      article.find('.article-formatted-body p:first-child img:first-child').attr('src');

    return src;
  }

  private getCategoriesAndTags(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): [Category[], Tag[]] {
    const hubs = article
      .find('.tm-article-snippet__hubs .tm-article-snippet__hubs-item a')
      .map((_, element) => $(element));

    const categories = [];
    const tags = [];

    for (const hub of hubs) {
      const title = hub.text().replace('*', '').trim();
      const href = this.getFullHref(hub.attr('href')) ?? '';

      if (title.startsWith('Блог компании')) {
        categories.push({ title, href });
      }
      else if (title !== '.NET') {
        tags.push({ title, href });
      }
    }

    return [categories, tags];
  }

  private getMaxDescriptionLength(title: string, href: string, categories: Category[], tags: Tag[]): number | undefined {
    let result = 1024;

    result -= title.length;
    result -= href.length * 2; // + the "read" link,
    result -= 25; // html tags

    result -= this.blog.title.length;
    result -= this.blog.href.length;
    result -= 25; // html tags

    for (const category of categories) {
      result -= category.title.length;
      result -= category.href.length;
      result -= 25; // html tags
    }

    result -= 40; // date

    for (const tag of tags) {
      result -= tag.title.length;
      result -= tag.href.length;
      result -= 20; // html tags
    }

    if (result > 200) {
      return result;
    }
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI, maxLength?: number): string[] {
    const description = [];
    let length = 0;

    const body = article.find('.article-formatted-body');
    if (body.hasClass('article-formatted-body_version-1')) {
      const lines = body.text().split('\n')
        .map(line => line.trim())
        .filter(line => !!line);

      for (const line of lines) {
        if (description.length > 0 && maxLength && length + line.length > maxLength && length < maxLength) {
          break;
        }

        length += line.length;
        description.push(line);
      }
    }
    else if (body.hasClass('article-formatted-body_version-2')) {

      const elements = body.children();
      for (const element of elements) {
        if (element.name == 'p') {
          const line = $(element).text().trim();
          if (line) {
            if (description.length > 0 && maxLength && length + line.length > maxLength && length < maxLength) {
              break;
            }

            length += line.length;
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

  private getFullHref(href: string | undefined): string | undefined {
    if (href && href.startsWith('/')) {
      href = 'https://habr.com' + href;
    }

    return href;
  }
}
