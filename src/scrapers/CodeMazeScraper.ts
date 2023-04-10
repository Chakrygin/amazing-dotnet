import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class CodeMazeScraper extends HtmlPageScraper {
  constructor(
    private readonly knownHosts: readonly string[]) {
    super();
  }

  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  private readonly blog: Link = {
    title: 'Code Maze',
    href: 'https://code-maze.com',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#et-boc .homePage_LatestPost article', ($, article) => {
      const image = this.getDefaultImage(article);
      const link = article.find('h2.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate(article);

      const post: Post = {
        image,
        title,
        href,

        categories: [
          this.blog,
        ],
        date: moment(date, 'LL', 'en'),
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

  private getDefaultImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.et_pb_image_container img').attr('src');
    if (src) {
      src = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    }

    return src;
  }

  private getDate(article: cheerio.Cheerio<cheerio.Element>): string {
    let date = article.find('.post-meta .published').text();
    if (date) {
      date = date.replace('Updated Date', '');
    }

    return date.trim();
  }

  protected override enrichPost(post: Post): Promise<Post> {
    return this.readPostFromHtmlPage(post.href, '#content-area article', ($, article) => {

      if (post.title.startsWith('Code Maze Weekly')) {
        const description = this.getWeeklyDescription($, article);

        post = {
          ...post,
          description,
        };
      }
      else {
        const image = this.getImage($, article);
        const description = this.getDescription($, article);

        post = {
          ...post,
          image: image ?? post.image,
          description,
        };
      }

      return post;
    });
  }

  private getImage($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const elements = article.find('.post-content img');

    for (const element of elements) {
      const image = $(element);
      const width = image.attr('width');
      const height = image.attr('height');

      if (width && height) {
        if (parseInt(width) >= 320 && parseInt(height) >= 240) {
          return image.attr('src');
        }
      }
    }
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];

    const elements = article.find('.post-content').children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
        const text = p.text().trim();

        if (text) {
          description.push(text);

          if (description.length >= 3) {
            break;
          }

          if (text.includes('In this article')) {
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

  private getWeeklyDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] | undefined {
    const description: string[] = [];

    const elements = article.find('.post-content a.entryTitle');
    for (const element of elements) {
      const link = $(element);
      const title = link.text().trim();
      const href = link.attr('href');

      if (title && href && !this.isKnownHost(href)) {
        description.push(`${title}: ${href}`);

        if (description.length >= 10) {
          break;
        }
      }
    }

    if (description.length > 0) {
      return description;
    }
  }

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }
}
