import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post } from '../models';

export default class BookClubDotNetScraper extends ScraperBase {
  readonly name = 'BookClubDotNet';
  readonly path = 'bookclub-dotnet.mave.digital';

  private readonly source: Category = {
    title: 'BookClub DotNet',
    href: 'https://bookclub-dotnet.mave.digital/',
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data);
    const episodes = $('.episodes-season__body a.episode').toArray();

    if (episodes.length == 0) {
      throw new Error('Failed to parse html page. No post found.');
    }

    core.info(`Html page parsed. ${episodes.length} post found.`);

    const image = $('.sidebar__header .img-wrapper img').attr('src');

    for (let index = 0; index < episodes.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const episode = $(episodes[index]);
      const title = episode.find('.episode-body__content .description').text();
      const href = this.getFullHref(episode.attr('href')) ?? '';
      const date = episode.find('.episode-body__content .date').text();

      const post: Post = {
        image: image,
        title: title,
        href: href,
        categories: [
          this.source,
        ],
        date: moment(date, 'LL', 'ru'),
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href && href.startsWith('/')) {
      href = this.source.href + href.substring(1);
    }

    return href;
  }

  protected override async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data);

    const description = this.getDescription($);

    post = {
      image: post.image,
      title: post.title,
      href: post.href,
      categories: post.categories,
      date: post.date,
      description: [
        description,
        `??????????????: ${post.href}`
      ]
    };

    return post;
  }


  private getDescription($: cheerio.CheerioAPI): string {
    const elements = $('.episodes-info__body .description').contents().first();

    for (const element of elements) {
      const success =
        (element.type == 'text') ||
        (element.type == 'tag' && element.name == 'p');

      if (!success) {
        break;
      }

      const description = $(element).text().trim();
      if (description) {
        return description;
      }
    }

    return $('.sidebar__body p.description').text().trim();
  }
}
