import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class HaackedScraper extends HtmlPageScraper {
  readonly name = 'Haacked';
  readonly path = 'haacked.com';
  readonly author = 'Phil Haack';

  private readonly Haacked: Link = {
    title: 'You\'ve Been Haacked',
    href: 'https://haacked.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.Haacked.href)
      .fetchPosts(HaackedFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.Haacked,
          ],
          author: this.author,
          date: moment(reader.date),
          description: [
            reader.description,
          ],
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
      href = this.Haacked.href + href;
    }

    return href;
  }
}

class HaackedFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = 'main .posts-list .post-header';

  private readonly content = this.article.next('.post-content');
  private readonly link = this.article.find('h1.post-title a');

  readonly image = this.content.find('img').attr('src');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('.meta time.date').attr('datetime');
  readonly description = this.content.find('p').text();
  readonly tags = this.article.find('.meta .tags').text().trim().split(/\s+/);
}
