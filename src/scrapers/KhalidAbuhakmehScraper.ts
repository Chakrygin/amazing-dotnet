import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class KhalidAbuhakmehScraper extends HtmlPageScraper {
  readonly name = 'KhalidAbuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly blog: Link = {
    title: 'Khalid Abuhakmeh',
    href: 'https://khalidabuhakmeh.com',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#page article', ($, article) => {
      const image = this.getImage(article);
      const link = article.find('h2.post-title a');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('time.published').text();
      const description = this.getDescription($, article);
      const tags = article
        .find('.post-content .post-tags a')
        .map((_, element) => $(element).text().replace(/^#/, ''))
        .toArray();

      const post: Post = {
        image: image,
        title: title,
        href: href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
        description: description,
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
        tags,
      };

      return post;
    });
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.post-thumbnail img').attr('src');
    if (src) {
      const index = src.lastIndexOf('https://');
      if (index > 0) {
        src = src.substring(index);
      }
    }

    return src;
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];

    const elements = article
      .find('.post-content')
      .children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        if (p.hasClass('post-tags') || p.hasClass('read-more')) {
          break;
        }

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

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.blog.href + href;
    }

    return href;
  }
}
