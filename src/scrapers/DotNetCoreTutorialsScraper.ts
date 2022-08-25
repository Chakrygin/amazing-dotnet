import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post } from '../models';

const DEFAULT_IMAGE = 'https://dotnetcoretutorials.com/wp-content/uploads/2017/07/DotNetCoreTutorialsLogoNew.png';

export default class DotNetCoreTutorialsScraper extends ScraperBase {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';

  private readonly blog: Category = {
    title: '.NET Core Tutorials',
    href: 'https://dotnetcoretutorials.com/',
  };

  private readonly author: Category = {
    title: 'Wade Gausden',
    href: 'https://dotnetcoretutorials.com/about/',
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const articles = $('#content article').toArray();

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
        image: image ?? DEFAULT_IMAGE,
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
    const img = article.find('img');
    const width = img.attr('width');
    const height = img.attr('height');

    if (width && height) {
      if (parseInt(width) >= 320 && parseInt(height) >= 240) {
        return img.attr('data-lazy-src') ?? img.attr('src');
      }
    }
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = article
      .find('div.entry-content')
      .children();

    let length = 0;
    for (const element of elements) {
      if (element.type != 'tag') {
        continue;
      }

      let text = '';

      if (element.name == 'p') {
        if ($('br', element).length == 0) {
          text = $(element).text().trim();
        }
      }
      else if (element.name == 'ul') {
        text = $(element).children()
          .filter((_, e) => e.type == 'tag' && e.name == 'li')
          .map((_, e) => '- ' + $(e).text().trim())
          .toArray().join('\n');
      }

      if (!text) {
        break;
      }

      length += text.length;
      description.push(text);

      if (length >= 500 || description.length >= 10) {
        break;
      }
    }

    if (description.length > 0) {
      const text = description[description.length - 1];

      if (text.endsWith(':')) {
        description.push('…');
      }
    }

    return description;
  }
}
