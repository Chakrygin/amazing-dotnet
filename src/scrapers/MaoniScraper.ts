import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class MaoniScraper implements Scraper {
  readonly name = 'Maoni';
  readonly path = 'maoni0.medium.com';

  private readonly blog: Link = {
    title: 'Maoni Stephens',
    href: 'https://maoni0.medium.com',
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
      const header = article.find('h2');
      const title = header.text();
      const link = header.parents('a').first();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('a>p>span').first().text();

      let post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
        links: [
          {
            title: 'Read more',
            href: href,
          }
        ],
      }

      post = await this.enrichPost(post);

      yield post;
    }
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href) {
      if (href.startsWith('/')) {
        href = this.blog.href + href;
      }

      const index = href.indexOf('?');
      if (index > 0) {
        href = href.substring(0, index);
      }
    }

    return href;
  }

  protected async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data as string);
    const article = $('main article');
    const description = this.getDescription(article, $);

    post = {
      ...post,
      description,
    }

    return post;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];
    const elements = $(article)
      .find('section p.pw-post-body-paragraph')
      .first()
      .parent()
      .children()
      .toArray();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        if (p.hasClass('pw-post-body-paragraph')) {
          const text = p.text().trim();
          if (text) {
            description.push(text);
          }
        }
        else if (description.length > 0) {
          break
        }
      }
      else if (description.length > 0) {
        break
      }
    }

    return description;
  }
}
