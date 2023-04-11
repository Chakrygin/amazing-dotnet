import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class EnterpriseCraftsmanshipScraper extends HtmlPageScraper {
  readonly name = 'EnterpriseCraftsmanship';
  readonly path = 'enterprisecraftsmanship.com';
  readonly author = 'Vladimir Khorikov';

  private readonly blog: Link = {
    title: 'Enterprise Craftsmanship',
    href: 'https://enterprisecraftsmanship.com/posts',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#main article.post', ($, article) => {
      const title = article.find('h1.catalogue-title').text();
      const href = article.attr('href') ?? '';
      const date = article.find('time.catalogue-time').text();
      const description = article.find('div.paragraph p')
        .map((_, p) => $(p).text().trim())
        .filter((_, text) => !!text)
        .toArray();

      const post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(date, 'LL'),
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
}
