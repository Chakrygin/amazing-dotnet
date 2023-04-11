import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class MaoniScraper extends HtmlPageScraper {
  readonly name = 'Maoni';
  readonly path = 'maoni0.medium.com';

  private readonly blog: Link = {
    title: 'Maoni Stephens',
    href: 'https://maoni0.medium.com',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, 'main article', ($, article) => {
      const header = article.find('h2');
      const title = header.text();
      const link = header.parents('a').first();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('a>p>span').first().text();

      const post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
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

  private getFullHref(href: string | undefined): string | undefined {
    if (href) {
      if (href.startsWith('/')) {
        href = this.blog.href + href;
      }

      const index = href.indexOf('?');
      if (index > 0) {
        href = href.substring(0, index);
      }
    }

    return href;
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, 'main article', ($, article) => {
      const description = this.getDescription($, article);

      post = {
        ...post,
        description,
      };

      return post;
    });
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];

    const elements = $(article)
      .find('section p.pw-post-body-paragraph')
      .first()
      .parent()
      .children()
      .toArray();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        if (p.hasClass('pw-post-body-paragraph')) {
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
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }
}
