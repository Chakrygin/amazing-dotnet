import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class MeziantouScraper implements Scraper {
  readonly name = 'Meziantou';
  readonly path = 'meziantou.net';

  private readonly blog: Link & Required<Pick<Post, 'author'>> = {
    title: 'Meziantou\'s blog',
    href: 'https://www.meziantou.net',
    author: 'Gérald Barré',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('main article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const link = article.find('header>a');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('header>div>div>time').text();
      const tags = article
        .find('header>div>div>ul a')
        .map((_, element) => $(element))
        .map((_, tag) => tag.text())
        .toArray();

      if (!this.isDotNetPost(tags)) {
        core.info('Post does not have .NET tag. Continue scraping.');
        continue;
      }

      let post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.blog.author,
        date: moment(date, 'MM/DD/YY'),
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
        tags,
      };

      post = await this.enrichPost(post);

      yield post;
    }
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.blog.href + href;
    }

    return href;
  }

  private isDotNetPost(tags: string[]): boolean {
    for (const tag of tags) {
      if (tag === '.NET') {
        return true;
      }
    }

    return false;
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);

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
      if (element.name === 'p') {
        const p = $(element);
        const text = p.text().trim();
        if (text) {
          description.push(text);
        }
      }
      else if (element.name === 'aside') {
        continue;
      }
      else {
        break;
      }
    }

    return description;
  }
}
