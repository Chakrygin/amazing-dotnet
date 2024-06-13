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

  readonly CodeMaze: Link = {
    title: 'Code Maze',
    href: 'https://code-maze.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.CodeMaze.href)
      .fetchPosts(CodeMazeScrapeReader, reader => {
        const post: Post = {
          image: reader.getDefaultImage(),
          title: reader.title,
          href: reader.href,
          categories: [
            this.CodeMaze,
          ],
          date: moment(reader.getDate(), 'LL', 'en'),
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
      .enrichPost(CodeMazeEnrichReader, reader => {
        if (post.title.startsWith('Code Maze Weekly')) {
          post = {
            ...post,
            description: reader.getWeeklyDescription(href => this.isKnownHost(href)),
          };
        }
        else {
          post = {
            ...post,
            image: reader.getImage() ?? post.image,
            description: reader.getDescription(),
          };
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
}

class CodeMazeScrapeReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = '#et-boc .homePage_LatestPost article';

  readonly link = this.article.find('h2.entry-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';

  getDefaultImage(): string | undefined {
    let src = this.article.find('.et_pb_image_container img').attr('src');

    if (src) {
      src = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    }

    return src;
  }

  getDate(): string {
    let date = this.article.find('.post-meta .published').text();

    if (date) {
      date = date.replace('Updated Date', '');
    }

    return date.trim();
  }
}

class CodeMazeEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = '#content-area article';

  getImage(): string | undefined {
    const images = this.article
      .find('.post-content img');

    for (const element of images) {
      const image = this.$(element);
      const width = image.attr('width');
      const height = image.attr('height');

      if (width && height) {
        if (parseInt(width) >= 320 && parseInt(height) >= 240) {
          return image.attr('data-src');
        }
      }
    }
  }

  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('.post-content')
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

  getWeeklyDescription(isKnownHost: (href: string) => boolean): string[] | undefined {
    const description = [];
    const links = this.article
      .find('.post-content a.entryTitle');

    for (const element of links) {
      const link = this.$(element);
      const title = link.text().trim();
      const href = link.attr('href');

      if (title && href && !isKnownHost(href)) {
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
}
