import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class DotNetCoreTutorialsScraper implements Scraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';

  private readonly blog: Link & Required<Pick<Post, 'author'>> = {
    title: '.NET Core Tutorials',
    href: 'https://dotnetcoretutorials.com/',
    author: 'Wade Gausden',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('#main article.post').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = article.find('.post-image img').attr('data-lazy-src') ?? '';
      const link = article.find('.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate(href);

      let post: Post = {
        image: image,
        title: title,
        href: href,
        categories: [
          this.blog,
        ],
        author: this.blog.author,
        date: moment(date, 'YYYY/MM/DD'),
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

  private getDate(href: string): string {
    const regex = /\/(\d{4}\/\d{2}\/\d{2})\//;
    const match = href.match(regex);

    if (!match) {
      throw new Error('Failed to parse post. Can not get post date from href: ' + href);
    }

    return match[1];
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);
    const description = this.getDescription($);

    post = {
      ...post,
      description,
    };

    return post;
  }

  private getDescription($: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = $('#main .entry-content').children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        const text = p.text().trim();
        if (text) {
          description.push(text);

          if (description.length >= 3) {
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
