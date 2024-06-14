import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class CodeMazeScraper extends ScraperBase {
  constructor(
    private readonly knownHosts: readonly string[]) {
    super();
  }

  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  readonly CodeMaze: Link = {
    title: 'Code Maze',
    href: 'https://code-maze.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.CodeMaze.href)
      .fetchPosts('#et-boc .homePage_LatestPost article', ($, element) => {

        const image = this.getDefaultImage(element);
        const link = element.find('h2.entry-title a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = this.getDate(element);

        return {
          image,
          title,
          href,
          categories: [this.CodeMaze],
          date: moment(date, 'LL', 'en')
        };

      });
  }

  private getDefaultImage(element: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = element.find('.et_pb_image_container img').attr('src');
    if (src) {
      src = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    }

    return src;
  }

  private getDate(element: cheerio.Cheerio<cheerio.Element>): string {
    let date = element.find('.post-meta .published').text();
    if (date) {
      date = date.replace('Updated Date', '');
    }

    return date.trim();
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost('#content-area article', ($, element) => {
        if (post.title.startsWith('Code Maze Weekly')) {

          const description = this.getWeeklyDescription($, element);

          return {
            ...post,
            description,
          };

        }
        else {

          const image = this.getImage($, element);
          const description = this.getDescription($, element);

          return {
            ...post,
            image: image ?? post.image,
            description,
          };

        }
      });
  }

  private getWeeklyDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] | undefined {
    const description = [];
    const links = element
      .find('.post-content a.entryTitle')
      .map((_, link) => $(link));

    for (const link of links) {
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

  private getImage($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const images = element
      .find('.post-content img')
      .map((_, image) => $(image));

    for (const image of images) {
      const width = image.attr('width');
      const height = image.attr('height');

      if (width && height) {
        if (parseInt(width) >= 320 && parseInt(height) >= 240) {
          return image.attr('data-src');
        }
      }
    }
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const children = element
      .find('.post-content')
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
}
