import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class CodeMazeScraper implements Scraper {
  constructor(
    private readonly knownHosts: readonly string[]) { }

  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  private readonly blog: Link = {
    title: 'Code Maze',
    href: 'https://code-maze.com',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('.homePage_LatestPost article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getDefaultImage(article);
      const link = article.find('h2.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate(article);

      let post: Post = {
        image,
        title,
        href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL', 'en'),
        links: [
          {
            title: 'Read more',
            href: href,
          }
        ]
      };

      post = await this.enrichPost(post);

      yield post;
    }
  }

  private getDefaultImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.et_pb_image_container img').attr('src');
    if (src) {
      src = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    }

    return src;
  }

  private getDate(article: cheerio.Cheerio<cheerio.Element>): string {
    let date = article.find('.post-meta .published').text();
    if (date) {
      date = date.replace('Updated Date', '');
    }

    return date.trim();
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);

    if (post.title.startsWith('Code Maze Weekly')) {
      const description = this.getWeeklyDescription($);

      post = {
        ...post,
        description,
      };
    }
    else {
      const image = this.getImage($);
      const description = this.getDescription($);

      post = {
        ...post,
        image: image ?? post.image,
        description,
      };
    }

    return post;
  }

  private getImage($: cheerio.CheerioAPI): string | undefined {
    const elements = $('#content-area .post-content img');
    for (const element of elements) {
      const image = $(element);
      const width = image.attr('width');
      const height = image.attr('height');

      if (width && height) {
        if (parseInt(width) >= 320 && parseInt(height) >= 240) {
          return image.attr('src');
        }
      }
    }
  }

  private getDescription($: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = $('#content-area .post-content').children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        const text = p.text().trim();
        description.push(text);

        if (description.length >= 3) {
          break;
        }

        if (text.includes('In this article')) {
          break;
        }
      }
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }

  private getWeeklyDescription($: cheerio.CheerioAPI): string[] | undefined {
    const description: string[] = [];

    const elements = $('#content-area .post-content a.entryTitle');
    for (const element of elements) {
      const link = $(element);
      const title = link.text();
      const href = link.attr('href');

      if (title && href && !this.isKnownHost(href)) {
        description.push(`${title}: ${href}`);

        if (description.length >= 10) {
          break;
        }
      }
    }

    if (description.length > 0) {
      return description;
    }
  }

  private isKnownHost(href: string): boolean {
    for (const knownHost of this.knownHosts) {
      if (href.indexOf(knownHost) > 0) {
        return true;
      }
    }

    return false;
  }
}
