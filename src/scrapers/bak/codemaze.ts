import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "../scrapers";
import { Sender } from "../bak";
import { Storage } from "../storage";
import { Author, Blog, Post } from "../models";

export class CodeMazeScraper implements Scraper {
  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  private readonly blog: Blog = {
    title: 'Code Maze',
    link: 'https://code-maze.com/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.sendPost(post);

      core.info('Storing post...');
      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.link}'...`);

    const response = await axios.get(this.blog.link);
    const $ = cheerio.load(response.data);
    const articles = $('.homePage_LatestPost article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('h2.entry-title a');
      const author = this.getAuthor(article);
      const date = this.getDate(article);
      const description = article.find('.post-content-inner').text().trim();

      const post: Post = {
        image: image,
        title: title.text().trim(),
        link: title.attr('href') ?? '',
        blog: this.blog,
        author: author,
        date: new Date(date),
        description: description,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.et_pb_image_container img').attr('src');
    if (src) {
      src = src.replace(/\-\d+x\d+(\.\w+)$/, '$1');
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

  private getAuthor(article: cheerio.Cheerio<cheerio.Element>): Author | undefined {
    const author = article.find('.post-meta .author a');
    const title = author.text().trim();
    const link = author.attr('href') ?? '';

    if (title !== 'Code Maze') {
      return { title, link };
    }
  }
}
