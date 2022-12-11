import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post, Tag } from '../models';

export default class MeziantouScraper extends ScraperBase {
  readonly name = 'Meziantou';
  readonly path = 'meziantou.net';

  private readonly blog: Category = {
    title: 'Meziantou\'s blog',
    href: 'https://www.meziantou.net'
  };

  private readonly author: Category = {
    title: 'Gérald Barré',
    href: 'https://github.com/meziantou',
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const articles = $('main article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const title = article.find('header>a');
      const href = this.getFullHref(title.attr('href')) ?? '';
      const date = article.find('header>div>div>time').text();

      const tags = article
        .find('header>div>div>ul a')
        .map((_, element) => $(element))
        .map((_, tag) => ({
          title: tag.text() ?? '',
          href: this.getFullHref(tag.attr('href')) ?? '',
        }))
        .toArray();

      if (!this.isDotNetPost(tags)) {
        core.info('It is not .NET post. Skipping...');
        continue;
      }

      const post: Post = {
        title: title.text(),
        href: href,
        categories: [
          this.blog,
          this.author,
        ],
        date: moment(date, 'MM/DD/YY'),
        links: [
          {
            title: 'Read',
            href: href,
          },
        ],
        tags: tags,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private isDotNetPost(tags: Tag[]): boolean {
    for (const tag of tags) {
      if (tag.title === '.NET') {
        return true;
      }
    }

    return false;
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href && href.startsWith('/')) {
      href = this.blog.href + href;
    }

    return href;
  }

  protected override async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data);

    const description = this.getDescription($);

    post = {
      ...post,
      description: description,
    };

    return post;
  }

  private getDescription($: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = $('main article')
      .find('>div')
      .first()
      .children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
        const text = p.text().trim();
        if (text) {
          description.push(text);
        }
      }
      else if (element.name == 'aside') {
        continue;
      }
      else {
        break;
      }
    }

    return description;
  }
}
