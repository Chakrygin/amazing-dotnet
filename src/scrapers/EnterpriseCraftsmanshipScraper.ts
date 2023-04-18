import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class EnterpriseCraftsmanshipScraper extends HtmlPageScraper {
  readonly name = 'EnterpriseCraftsmanship';
  readonly path = 'enterprisecraftsmanship.com';
  readonly author = 'Vladimir Khorikov';

  private readonly EnterpriseCraftsmanship: Link = {
    title: 'Enterprise Craftsmanship',
    href: 'https://enterprisecraftsmanship.com/posts',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.EnterpriseCraftsmanship.href)
      .fetchPosts(EnterpriseCraftsmanshipFetchReader, reader => {
        const post: Post = {
          title: reader.title,
          href: reader.href,
          categories: [
            this.EnterpriseCraftsmanship,
          ],
          author: this.author,
          date: moment(reader.date, 'LL'),
          description: reader.description,
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
}

class EnterpriseCraftsmanshipFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = 'main .catalogue a.catalogue-item';

  readonly title = this.article.find('h1.catalogue-title').text();
  readonly href = this.article.attr('href') ?? '';
  readonly date = this.article.find('time.catalogue-time').text();
  readonly description = this.article.find('div.paragraph p')
    .map((_, element) => this.$(element).text().trim())
    .filter((_, text) => !!text)
    .toArray();
}
