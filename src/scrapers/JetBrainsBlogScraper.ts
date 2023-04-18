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

export class JetBrainsBlogScraper extends HtmlPageScraper {
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
      .fetchPosts(JetBrainsBlogFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: reader.title,
          href: reader.href,
          categories: [
            this.JetBrainsBlog,
            this.categoryOrTag,
          ],
          date: moment(reader.date),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
        };

        return post;
      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost(JetBrainsBlogEnrichReader, reader => {
        post = {
          ...post,
          description: this.id === 'net-annotated'
            ? reader.getAnnotatedDescription(href => this.isKnownHost(href))
            : reader.getDescription(),
          tags: reader.tags,
        };

        if (!this.isInterestingPost(post)) {
          return;
        }

        return post;
      });
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

class JetBrainsBlogFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '.card_container a.card';

  readonly image = this.article.find('img.wp-post-image').attr('src');
  readonly title = this.article.find('.card__header h3').text();
  readonly href = this.article.attr('href') ?? '';
  readonly date = this.article.find('.card__header time.publish-date').attr('datetime');

}

class JetBrainsBlogEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#main>.article-section';

  readonly tags = this.article
    .find('.tag-list>a.tag')
    .map((_, element) => this.$(element).text())
    .toArray();

  getDescription(): string[] {
    const description: string[] = [];
    const elements = this.article
      .find('>.content')
      .children();

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

    return description;
  }

  getAnnotatedDescription(isKnownHost: (href: string) => boolean): string[] {
    const description = [];
    const elements = this.article
      .find('>.content>ul>li>a:first-child');

    for (const element of elements) {
      const link = this.$(element);
      const title = link.text();
      const href = link.attr('href');

      if (title && href && !isKnownHost(href)) {
        description.push(`${title}: ${href}`);

        if (description.length >= 10) {
          break;
        }
      }
    }

    return description;
  }
}
