import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class CodeOpinionScraper extends HtmlPageScraper {
  readonly name = 'CodeOpinion';
  readonly path = 'codeopinion.com';
  readonly author = 'Derek Comartin';

  private readonly blog: Link = {
    title: 'CodeOpinion',
    href: 'https://codeopinion.com',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#main article', ($, article) => {
      const image = this.getImage(article);
      const link = article.find('h2.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = article.find('time.entry-date').text();
      const description = this.getDescription($, article);

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(date, 'LL', 'en'),
        description,
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

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const href = article.find('.container-youtube a[href^=https://www.youtube.com/]').attr('href');
    if (href) {
      const index = href.indexOf('?');
      if (index > 0) {
        const query = href.substring(index + 1);
        const pairs = query.split('&');

        for (const pair of pairs) {
          const [name, value] = pair.split('=');

          if (name == 'v') {
            return `https://img.youtube.com/vi/${value}/maxresdefault.jpg`;
          }
        }
      }
    }
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];

    const elements = article
      .find('div.entry-content')
      .children();

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
}
