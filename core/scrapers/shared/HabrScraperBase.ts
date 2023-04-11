import * as core from '@actions/core';

import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../models';
import { Sender } from '../../senders';
import { Storage } from '../../storages';
import { HtmlPageScraper } from '../HtmlPageScraper';

export interface HabrScraperOptions {
  readonly minRating: number;
}

export class HabrScraperBase extends HtmlPageScraper {
  constructor(
    private readonly hubId: string,
    private readonly hubName: string,
    private readonly options: HabrScraperOptions) {
    super();
  }

  readonly name = `Habr / ${this.hubName}`;
  readonly path = 'habr.com';
  readonly href = `https://habr.com/ru/hub/${this.hubId}/`;

  private readonly Habr: Link = {
    title: 'Хабр',
    href: 'https://habr.com',
  };

  override async scrape(sender: Sender, storage: Storage): Promise<void> {
    for await (const post of this.readPosts()) {
      this.printPost(post);

      if (storage.has(post.href)) {
        core.info('The post already exists in the storage. Continue scraping.');
        continue;
      }

      this.printPostJson(post);

      core.info('Sending the post...');
      await sender.send(post);

      core.info('Storing the post...');
      storage.add(post.href);
    }
  }

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.href, '.tm-articles-list article.tm-articles-list__item', ($, article) => {
      const image = this.getImage(article);
      const link = article.find('a.tm-title__link');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('.tm-article-datetime-published time').attr('datetime') ?? '';
      const [categories, tags] = this.getCategoriesAndTags(article, $);
      const description = this.getDescription(article, $);
      const rating = this.getRaring(article);

      if (rating < this.options.minRating) {
        core.info('Post rating is too low. Continue scraping.');
        return;
      }

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.Habr,
          ...categories,
        ],
        date: moment(date).locale('ru'),
        description,
        links: [
          {
            title: 'Читать дальше',
            href: href,
          },
        ],
        tags,
      };

      return post;
    });
  }

  private getRaring(article: cheerio.Cheerio<cheerio.Element>): number {
    const text = article.find('.tm-votes-meter__value').text();
    const rating = parseInt(text);

    if (isNaN(rating)) {
      throw new Error('Failed to parse post. Rating is NaN.');
    }

    return rating;
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const src =
      article.find('img.tm-article-snippet__lead-image').attr('src') ??
      article.find('.article-formatted-body p:first-child img:first-child').attr('src');

    return src;
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.Habr.href + href;
    }

    return href;
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

    const body = article
      .find('.article-formatted-body');

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
