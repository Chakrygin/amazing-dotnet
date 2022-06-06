import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import ScraperBase from './ScraperBase';

import { Category, Post, } from '../models';

export default class CodeMazeScraper extends ScraperBase {
  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  private readonly blog: Category = {
    title: 'Code Maze',
    href: 'https://code-maze.com/',
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data);
    const articles = $('.homePage_LatestPost article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getDefaultImage(article);
      const title = article.find('h2.entry-title a');
      const date = this.getDate(article);

      const post: Post = {
        image: image,
        title: title.text(),
        href: title.attr('href') ?? '',
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL', 'en'),
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

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

  protected override async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data);

    const image = this.getContentImage($);
    const description = this.getDescription($);

    post = {
      image: image ?? post.image,
      title: post.title,
      href: post.href,
      categories: post.categories,
      date: post.date,
      description: [
        ...description,
        `Read: ${post.href}`,
      ]
    };

    return post;
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
      else if (description.length == 0) {
        continue;
      }
      else {
        break;
      }
    }

    return description;
  }

  private getContentImage($: cheerio.CheerioAPI): string | undefined {
    const images = $('#content-area .post-content img');

    for (let index = 0; index < images.length; index++) {
      const image = $(images[index]);

      const width = image.attr('width');
      const height = image.attr('height');

      if (width && height) {
        if (parseInt(width) >= 320 && parseInt(height) >= 240) {
          return image.attr('src');
        }
      }
    }
  }
}
