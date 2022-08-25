import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post } from '../models';

export default class CodeOpinionScraper extends ScraperBase {
  readonly name = 'CodeOpinion';
  readonly path = 'codeopinion.com';

  private readonly blog: Category = {
    title: 'CodeOpinion',
    href: 'https://codeopinion.com/'
  };

  private readonly author: Category = {
    title: 'Derek Comartin',
    href: 'https://mvp.microsoft.com/en-us/PublicProfile/5002380'
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const articles = $('#main article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('h2.entry-title a');
      const href = title.attr('href') ?? '';
      const date = article.find('time.entry-date').text();
      const description = this.getDescription(article, $);

      const post: Post = {
        image: image,
        title: title.text(),
        href: href,
        categories: [
          this.blog,
          this.author,
        ],
        date: moment(date, 'LL'),
        description: description,
        links: [
          {
            title: 'Read',
            href: href,
          }
        ]
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const href = article.find('.container-youtube a[href^=https://www.youtube.com/]').attr('href');
    if (href) {
      const index = href.indexOf('?');
      if (index > 0) {
        const query = href.substring(index + 1);
        const pairs = query.split('&');

        for (const pair of pairs) {
          const [name, value] = pair.split('=');

          if (name == 'v') {
            return `https://img.youtube.com/vi/${value}/maxresdefault.jpg`;
          }
        }
      }
    }
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = article
      .find('div.entry-content')
      .children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
        const text = p.text().trim();

        if (text) {
          description.push(text);
        }
      }
      else {
        break;
      }
    }

    return description;
  }
}
