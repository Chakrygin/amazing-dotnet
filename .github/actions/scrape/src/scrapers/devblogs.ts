import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { ScraperOptions, ScraperBase } from "./base";
import { Sender } from "../abstractions";
import { Post, Blog } from '../models';
import { validatePost } from '../validators';

export interface DevBlogsScraperOptions extends ScraperOptions {
  readonly blog: Blog;
}

export class DevBlogsScraper extends ScraperBase<DevBlogsScraperOptions>{
  protected async scrapeInternal(sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (this.storage.has(post.date, post.link)) {
        break;
      }

      await sender.sendPost(post);

      this.storage.add(post.date, post.link);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Download html page by url '${this.options.blog.link}'.`);
    const response = await axios.get(this.options.blog.link);
    const $ = cheerio.load(response.data);
    const elements = $('#content .entry-box').toArray();

    if (elements.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    for (let index = 0; index < elements.length; index++) {
      core.info(`Parse post at index ${index}.`);
      const element = $(elements[index]);
      const title = element.find('.entry-title a');
      const image = element.find('.entry-image img');
      const date = element.find('.entry-post-date');
      const author = element.find('.entry-author-link a');

      const description = element
        .find('.entry-content')
        .contents()
        .filter(function (index, element) {
          return this.type == 'text';
        })
        .text()
        .trim();

      const tags = element
        .find('.card-tags-links .card-tags-linkbox a')
        .map((_, element) => $(element))
        .toArray();

      const post: Post = {
        title: title.text().trim(),
        link: title.attr('href') ?? '',
        image: image.attr('data-src') ?? '',
        date: new Date(date.text()),
        blog: this.options.blog,
        author: {
          title: author.text().trim(),
          link: author.attr('href') ?? '',
        },
        description: [description],
        tags: tags.map(tag => {
          return {
            title: tag.text().trim(),
            link: tag.attr('href') ?? '',
          };
        }),
      };

      validatePost(post);

      yield post;
    }
  }
}
