import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

const Categories = {
  'how-tos': 'How-To\'s',
  'releases': 'Releases',
  'net-annotated': '.NET Annotated',
};

export default class JetBrainsScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof Categories,
    private readonly knownHosts: readonly string[] = []) { }

  readonly name = `JetBrains / ${Categories[this.id]}`;
  readonly path = `blog.jetbrains.com/${this.id}`;

  private readonly blog: Link = {
    title: 'The JetBrains Blog',
    href: 'https://blog.jetbrains.com/dotnet/',
  };

  private readonly category: Link = {
    title: Categories[this.id],
    href: this.id === 'net-annotated'
      ? `https://blog.jetbrains.com/dotnet/tag/${this.id}/`
      : `https://blog.jetbrains.com/dotnet/category/${this.id}/`,
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.category.href}'...`);

    const response = await axios.get(this.category.href);
    const $ = cheerio.load(response.data as string);
    const cards = $('.card_container a.card').toArray();

    if (cards.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${cards.length} posts found.`);

    for (let index = 0; index < cards.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const card = $(cards[index]);
      const image = card.find('img.wp-post-image').attr('src');
      const title = card.find('.card__header h3').text();
      const href = card.attr('href') ?? '';
      const date = card.find('.card__header time.publish-date').attr('datetime');

      let post: Post = {
        image,
        title,
        href,
        categories: [
          this.blog,
          this.category,
        ],
        date: moment(date),
        links: [
          {
            title: 'Read more',
            href: href,
          }
        ]
      };

      post = await this.enrichPost(post);

      if (!this.isInterestingPost(post)) {
        core.info('Post is not interesting. Continue scraping.');
        continue;
      }

      yield post;
    }
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);
    const article = $('.article-section .content');
    const description = this.id !== 'net-annotated'
      ? this.getDescription(article, $)
      : this.getAnnotatedDescription(article, $);
    const tags = this.getTags(article, $);

    post = {
      ...post,
      description,
      tags,
    };

    return post;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description: string[] = [];

    const elements = $(article).children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        const text = p.text().trim();
        if (text) {
          description.push(text);

          if (description.length >= 3) {
            break;
          }
        }
      }
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }

  private getAnnotatedDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = $(article).find('>ul>li>a:first-child');
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

    return description;
  }

  private getTags(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const tags = $(article)
      .find('>a.tag')
      .map((_, element) => $(element).text())
      .toArray();

    return tags;
  }

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }

  private isInterestingPost(post: Post): boolean {
    if (post.tags) {
      for (const tag of post.tags) {
        if (tag === 'Webinars' || tag === 'Bugfix') {
          return false;
        }
      }
    }

    return true;
  }
}
