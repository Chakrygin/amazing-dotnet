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
    for await (const post of this.fetchPosts()) {
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

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.href)
      .fetchPosts(HabrFetchReader, reader => {
        if (isNaN(reader.rating)) {
          throw new Error('Failed to parse post. Rating is NaN.');
        }

        if (reader.rating < this.options.minRating) {
          core.info('Post rating is too low. Continue scraping.');
          return;
        }

        const [categories, tags] = reader.getCategoriesAndTags();

        const post: Post = {
          image: reader.getImage(),
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.Habr,
            ...categories
              .map(category => ({
                title: category.title,
                href: this.getFullHref(category.href),
              })),
          ],
          date: moment(reader.date).locale('ru'),
          description: reader.getDescription(),
          links: [
            {
              title: 'Читать дальше',
              href: this.getFullHref(reader.href),
            },
          ],
          tags,
        };

        return post;
      });
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.Habr.href + href;
    }

    return href;
  }
}

class HabrFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '.tm-articles-list article.tm-articles-list__item';

  readonly rating = parseInt(this.article.find('.tm-votes-meter__value').text());
  readonly link = this.article.find('a.tm-title__link');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('.tm-article-datetime-published time').attr('datetime') ?? '';

  getImage(): string | undefined {
    const src =
      this.article.find('img.tm-article-snippet__lead-image').attr('src') ??
      this.article.find('.article-formatted-body p:first-child img:first-child').attr('src');

    return src;
  }

  getCategoriesAndTags(): [Link[], string[]] {
    const categories: Link[] = [];
    const tags: string[] = [];
    const elements = this.article
      .find('.tm-article-snippet__hubs .tm-article-snippet__hubs-item a');

    for (const element of elements) {
      const link = this.$(element);
      const title = link.text().replace('*', '');
      const href = link.attr('href') ?? '';

      if (title.startsWith('Блог компании')) {
        categories.push({ title, href });
      }
      else {
        tags.push(title);
      }
    }

    return [categories, tags];
  }

  getDescription(): string[] {
    const description = [];
    const body = this.article
      .find('.article-formatted-body');

    if (body.hasClass('article-formatted-body_version-1')) {
      const lines = body.text().split('\n')
        .map(line => line.trim())
        .filter(line => !!line);

      for (const line of lines) {
        description.push(line);

        if (description.length >= 5) {
          break;
        }
      }
    }
    else if (body.hasClass('article-formatted-body_version-2')) {
      const elements = body.children();

      for (const element of elements) {
        if (element.name == 'p') {
          const p = this.$(element);
          const text = p.text().trim();

          if (text) {
            description.push(text);

            if (description.length >= 5) {
              break;
            }
          }
        }
        else if (description.length > 0) {
          break;
        }
      }
    }

    return description;
  }
}
