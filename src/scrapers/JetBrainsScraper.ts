import * as core from '@actions/core';

import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';
const Categories = {
  'how-tos': 'How-To\'s',
  'releases': 'Releases',
};

const Tags = {
  'net-annotated': '.NET Annotated',
};

export class JetBrainsScraper extends HtmlPageScraper {
  constructor(
    private readonly id: keyof typeof Categories | keyof typeof Tags,
    private readonly knownHosts: readonly string[] = []) {
    super();
  }

  readonly name = `JetBrains / ${{ ...Categories, ...Tags }[this.id]}`;
  readonly path = `blog.jetbrains.com/${this.id}`;

  private readonly blog: Link = {
    title: 'The JetBrains Blog',
    href: 'https://blog.jetbrains.com/dotnet/',
  };

  private readonly category: Link = {
    title: { ...Categories, ...Tags }[this.id],
    href: this.id in Categories
      ? `https://blog.jetbrains.com/dotnet/category/${this.id}/`
      : `https://blog.jetbrains.com/dotnet/tag/${this.id}/`,
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '.card_container a.card', ($, article) => {
      const image = article.find('img.wp-post-image').attr('src');
      const title = article.find('.card__header h3').text();
      const href = article.attr('href') ?? '';
      const date = article.find('.card__header time.publish-date').attr('datetime');

      const post: Post = {
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
          },
        ],
      };

      return post;
    });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, '.article-section .content', ($, article) => {
      const description = this.id !== 'net-annotated'
        ? this.getDescription($, article)
        : this.getAnnotatedDescription($, article);
      const tags = this.getTags($, article);

      post = {
        ...post,
        description,
        tags,
      };

      if (!this.isInterestingPost(post)) {
        core.info('Post is not interesting. Continue scraping.');
        return;
      }

      return post;
    });
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];

    const elements = $(article).children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
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

    return description;
  }

  private getAnnotatedDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
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

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }

  private getTags($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const tags = $(article)
      .find('>a.tag')
      .map((_, element) => $(element).text())
      .toArray();

    return tags;
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
