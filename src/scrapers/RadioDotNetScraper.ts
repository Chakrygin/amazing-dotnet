import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';
import 'moment/locale/ru';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class RadioDotNetScraper implements Scraper {
  readonly name = 'RadioDotNet';
  readonly path = 'radiodotnet.mave.digital';

  private readonly source: Link = {
    title: 'RadioDotNet',
    href: 'https://radiodotnet.mave.digital',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data as string);
    const episodes = $('.episodes-season__body a.episode').toArray();

    if (episodes.length == 0) {
      throw new Error('Failed to parse html page. No post found.');
    }

    core.info(`Html page parsed. Number of posts found is ${episodes.length}.`);

    for (let index = 0; index < episodes.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const episode = $(episodes[index]);
      const image = $('.sidebar__header .img-wrapper img').attr('src') ?? '';
      const release = episode.find('.episode-body__content .release').text().trim();
      const title = episode.find('.episode-body__content .description').text().trim();
      const href = this.getFullHref(episode.attr('href')) ?? '';
      const date = episode.find('.episode-body__content .date').text();

      let post: Post = {
        image,
        title: `${release}. ${title}`,
        href: href,
        categories: [
          this.source,
        ],
        date: moment(date, 'LL', 'ru'),
        links: [
          {
            title: 'Слушать',
            href: href,
          },
        ],
      };

      post = await this.enrichPost(post);

      yield post;
    }
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.source.href + href;
    }

    return href;
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);

    const description = this.getDescription($) ?? this.getDefaultDescription($);
    const links = this.getLinks($);

    post = {
      ...post,
      description: [
        description,
      ],
      links: [
        ...post.links ?? [],
        ...links,
      ]
    };

    return post;
  }

  private getDescription($: cheerio.CheerioAPI): string | undefined {
    const description = [];

    const regexp = /^\[\d{2}:\d{2}:\d{2}\]/;
    const elements = $('.content .episodes-info__body .description>p').toArray();
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

  private getLinks($: cheerio.CheerioAPI): Link[] {
    const links: Link[] = [];

    const elements = $('.platforms a.platform');
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
