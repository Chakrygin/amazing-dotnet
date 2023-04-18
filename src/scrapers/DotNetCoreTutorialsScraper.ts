import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class DotNetCoreTutorialsScraper extends HtmlPageScraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';
  readonly author = 'Wade Gausden';

  private readonly DotNetCoreTutorials: Link = {
    title: '.NET Core Tutorials',
    href: 'https://dotnetcoretutorials.com/',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.DotNetCoreTutorials.href)
      .fetchPosts(DotNetCoreTutorialsFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: reader.title,
          href: reader.href,
          categories: [
            this.DotNetCoreTutorials,
          ],
          author: this.author,
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
      .enrichPost(DotNetCoreTutorialsEnrichReader, reader => {
        post = {
          ...post,
          description: reader.getDescription(),
        };

        return post;
      });
  }
}

class DotNetCoreTutorialsFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#main article.post:first-of-type';

  readonly image = this.article.find('.post-image img').attr('data-lazy-src') ?? '';
  readonly link = this.article.find('.entry-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
}

class DotNetCoreTutorialsEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#main article.post';

  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('.entry-content')
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
}
