import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class KhalidAbuhakmehScraper extends ScraperBase {
  readonly name = 'KhalidAbuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly KhalidAbuhakmeh: Link = {
    title: 'Khalid Abuhakmeh',
    href: 'https://khalidabuhakmeh.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.KhalidAbuhakmeh.href)
      .fetchPosts('#page article', ($, element) => {

        const image = this.getImage(element);
        const link = element.find('h2.post-title a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = element.find('time.published').text();
        const description = this.getDescription($, element);
        const tags = element
          .find('.post-content .post-tags a')
          .map((_, tag) => $(tag).text().replace(/^#/, ''))
          .toArray();

        return {
          image,
          title,
          href: this.getFullHref(href),
          categories: [this.KhalidAbuhakmeh],
          date: moment(date, 'LL'),
          description,
          tags,
        };

      });
  }

  private getImage(element: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = element.find('.post-thumbnail img').attr('src');
    if (src) {
      const index = src.lastIndexOf('https://');
      if (index > 0) {
        src = src.substring(index);
      }
    }

    return src;
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const children = element
      .find('.post-content')
      .children();

    for (const child of children) {
      if (child.name == 'p') {
        const p = $(child);

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

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.KhalidAbuhakmeh.href + href;
    }

    return href;
  }
}
