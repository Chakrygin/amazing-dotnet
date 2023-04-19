import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class StevenGieselScraper extends HtmlPageScraper {
  readonly name = 'StevenGiesel';
  readonly path = 'steven-giesel.com';

  private readonly StevenGiesel: Link = {
    title: 'Steven Giesel',
    href: 'https://steven-giesel.com/',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.StevenGiesel.href)
      .fetchPosts(StevenGieselFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.StevenGiesel,
          ],
          date: moment(reader.date, 'DD/MM/YYYY', 'en'),
          description: reader.getDescription(),
          links: [
            {
              title: 'Read more',
              href: this.getFullHref(reader.href),
            },
          ],
          tags: reader.tags,
        };

        return post;
      });
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.StevenGiesel.href + href;
    }

    return href;
  }
}

class StevenGieselFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = 'main .content article .blog-card';

  readonly image = this.article.find('.meta .photo picture img').attr('src') ?? '';
  readonly title = this.article.find('.description h1').text();
  readonly href = this.article.find('.description .read-more a').attr('href') ?? '';
  readonly date = this.article.find('.meta .details .date').text();
  readonly tags = this.article
    .find('.meta .details .tags .goto-tag')
    .map((_, element) => this.$(element).text().trim())
    .toArray();


  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('.description>p');

    for (const element of elements) {
      const p = this.$(element);
      const text = p.text().trim();

      if (text) {
        description.push(text);
      }
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }
}
