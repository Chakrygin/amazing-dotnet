import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class RadioDotNetScraper extends HtmlPageScraper {
  readonly name = 'RadioDotNet';
  readonly path = 'radiodotnet.mave.digital';

  private readonly podcast: Link = {
    title: 'RadioDotNet',
    href: 'https://radiodotnet.mave.digital',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.podcast.href, '.episodes-season__body a.episode', ($, episode) => {
      const image = $('.sidebar__header .img-wrapper img').attr('src') ?? '';
      const release = episode.find('.episode-body__content .release').text().trim();
      const title = episode.find('.episode-body__content .description').text().trim();
      const href = this.getFullHref(episode.attr('href')) ?? '';
      const date = episode.find('.episode-body__content .date').text();

      const post: Post = {
        image,
        title: `${release}. ${title}`,
        href: href,
        categories: [
          this.podcast,
        ],
        date: moment(date, 'LL', 'ru'),
        links: [
          {
            title: 'Слушать',
            href: href,
          },
        ],
      };

      return post;
    });
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.podcast.href + href;
    }

    return href;
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, 'main>div.single-page-wrapper', ($, episode) => {
      const description = this.getDescription($, episode) ?? this.getDefaultDescription($);
      const links = this.getLinks($, episode);

      post = {
        ...post,
        description: [
          description,
        ],
        links: [
          ...post.links,
          ...links,
        ],
      };

      return post;
    });
  }

  private getDescription($: cheerio.CheerioAPI, episode: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const description = [];

    const regexp = /^\[\d{2}:\d{2}:\d{2}\]/;
    const elements = episode
      .find('div.episodes-info__body>div.description>p')
      .toArray();

    for (const element of elements) {
      const p = $(element);
      const line = p.text().trim();

      if (regexp.test(line)) {
        description.push(line);
      }
    }

    if (description.length > 0) {
      return description.join('\n');
    }
  }

  private getDefaultDescription($: cheerio.CheerioAPI): string {
    const description = $('.sidebar__body p.description').text().trim();

    return description;
  }

  private getLinks($: cheerio.CheerioAPI, episode: cheerio.Cheerio<cheerio.Element>): Link[] {
    const links: Link[] = [];

    const elements = episode
      .find('.platforms a.platform');

    for (const element of elements) {
      const link = $(element);

      if (link.hasClass('yandex-music') || link.hasClass('youtube')) {
        const title = link.text();
        const href = link.hasClass('yandex-music')
          ? link.attr('href')?.replace('music.yandex.com', 'music.yandex.ru')
          : link.attr('href');

        if (title && href) {
          links.push({ title, href });
        }
      }
    }

    return links;
  }
}
