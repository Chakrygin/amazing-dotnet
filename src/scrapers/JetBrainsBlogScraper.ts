import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

const Categories = {
  'how-tos': 'How-To\'s',
  'releases': 'Releases',
};

const Tags = {
  'dotinsights': 'dotInsights',
};

export class JetBrainsBlogScraper extends ScraperBase {
  constructor(
    private readonly id: keyof typeof Categories | keyof typeof Tags,
    private readonly knownHosts: readonly string[] = []) {
    super();
  }

  readonly name = `JetBrains / ${{ ...Categories, ...Tags }[this.id]}`;
  readonly path = `blog.jetbrains.com/${this.id}`;

  private readonly JetBrainsBlog: Link = {
    title: 'The JetBrains Blog',
    href: 'https://blog.jetbrains.com/dotnet/',
  };

  private readonly categoryOrTag: Link = {
    title: { ...Categories, ...Tags }[this.id],
    href: this.id in Categories
      ? `https://blog.jetbrains.com/dotnet/category/${this.id}/`
      : `https://blog.jetbrains.com/dotnet/tag/${this.id}/`,
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.categoryOrTag.href)
      .fetchPosts('.card_container a.card', ($, element) => {

        const image = element.find('img.wp-post-image').attr('src');
        const title = element.find('.card__header h4').text();
        const href = element.attr('href') ?? '';
        const date = element.find('.card__footer time.publish-date').attr('datetime');

        const isInterestingPost =
          !title.includes('Webinar') &&
          !title.includes('Bug Fixes') &&
          !title.includes('Bug-fixes');

        if (isInterestingPost) {
          return {
            image,
            title,
            href,
            categories: [this.JetBrainsBlog, this.categoryOrTag],
            date: moment(date),
          };
        }

      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost('#main>.article-section', ($, element) => {

        const description = this.id !== 'dotinsights'
          ? this.getDescription($, element)
          : this.getDotInsightsDescription($, element);
        const tags = this.getTags($, element);

        const isInterestingPost =
          !tags.includes('bugfix') &&
          !tags.includes('Webinars');

        if (isInterestingPost) {
          return {
            ...post,
            description,
            tags,
          };
        }

      });
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];
    const children = element
      .find('>.content')
      .children();

    for (const child of children) {
      if (child.name == 'p') {
        const p = $(child);
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

  private getDotInsightsDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const links = element
      .find('>.content>ul>li>a:first-child')
      .map((_, link) => $(link));

    for (const link of links) {
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

  private getTags($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const tags = element
      .find('.tag-list>a.tag')
      .map((_, tag) => $(tag).text())
      .toArray();

    return tags;
  }
}
