import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class StevenGieselScraper extends ScraperBase {
  readonly name = 'StevenGiesel';
  readonly path = 'steven-giesel.com';

  private readonly StevenGiesel: Link = {
    title: 'Steven Giesel',
    href: 'https://steven-giesel.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.StevenGiesel.href)
      .fetchPosts('main .content article .blog-card', ($, element) => {

        const image = element.find('.meta .photo picture source').attr('srcset') ?? '';
        const title = element.find('.description h1').text();
        const href = element.find('.description .read-more a').attr('href') ?? '';
        const date = element.find('.meta .details .date').text();
        const description = this.getDescription($, element);
        const tags = element
          .find('.meta .details .tags .goto-tag')
          .map((_, tags) => $(tags).text().trim())
          .toArray();

        return {
          image,
          title,
          href: this.getFullHref(href),
          categories: [this.StevenGiesel],
          date: moment(date, 'DD/MM/YYYY', 'en'),
          description,
          tags,
        };

      });
  }


  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const children = element
      .find('.description')
      .children();

    for (const child of children) {
      if (child.name === 'p') {
        const p = $(child);
        if (p.hasClass('read-more')) {
          break;
        }

        const text = p.text().trim();
        if (text) {
          description.push(text);
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
      href = this.StevenGiesel.href + href;
    }

    return href;
  }
}
