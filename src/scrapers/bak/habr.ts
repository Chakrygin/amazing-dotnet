import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "../scrapers";
import { Sender } from "../bak";
import { Storage } from "../storage";
import { Author, Blog, Company, Post, Tag } from "../models";

export class HabrScraper implements Scraper {
  readonly name = 'Habr';
  readonly path = 'habr.com';

  private readonly blog: Blog = {
    title: 'Хабр',
    link: 'https://habr.com/ru/hub/net/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (post.rating < 10) {
        core.info('Post rating is too low. Continue scraping.');
        continue;
      }

      if (storage.has(post.link, post.date)) {
        core.info('Post already exists in storage. Continue scraping.');
        continue;
      }

      core.info('Sending post...');
      await sender.sendPost(post);

      core.info('Storing post...');
      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<HabrPost, void> {
    core.info(`Parsing html page by url '${this.blog.link}'...`);

    const response = await axios.get(this.blog.link);
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
      const [company, tags] = this.getCompanyAndTags(article, $);
      const rating = article.find('.tm-votes-meter__value').text()

      const post: HabrPost = {
        image: image,
        title: title.text().trim(),
        link: this.getFullHref(title.attr('href')) ?? '',
        blog: this.blog,
        company: company,
        author: {
          title: author.text().trim(),
          link: this.getFullHref(author.attr('href')) ?? '',
        },
        date: new Date(date),
        locale: 'ru-RU',
        description: description,
        tags: tags,
        rating: parseInt(rating),
      };

      if (isNaN(post.rating)) {
        throw new Error('Failed to parse post. Rating is invalid.');
      }

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const src =
      article.find('.tm-article-snippet__cover img').attr('src') ??
      article.find('.article-formatted-body img').attr('src');

    return src;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = article
      .find('.article-formatted-body')
      .children();

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

  private getCompanyAndTags(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): [Company | undefined, Tag[]] {
    const hubs = article
      .find('.tm-article-snippet__hubs .tm-article-snippet__hubs-item a')
      .map((_, element) => $(element));

    let company: Company | undefined;
    const tags = [];

    for (const hub of hubs) {
      const title = hub.text().replace('*', '').trim();
      const link = this.getFullHref(hub.attr('href')) ?? '';

      if (title.startsWith('Блог компании')) {
        if (!company) {
          company = { title, link };
        }
      }
      else if (title !== '.NET') {
        tags.push({ title, link });
      }
    }

    return [company, tags];
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href && href.startsWith('/')) {
      href = 'https://habr.com' + href;
    }

    return href;
  }
}

interface HabrPost extends Post {
  readonly rating: number;
}
