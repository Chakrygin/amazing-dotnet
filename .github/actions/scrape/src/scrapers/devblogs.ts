import axios from 'axios';
import * as cheerio from 'cheerio';

import { ScraperOptions, ScraperBase } from "./base";
import { Sender } from "../abstractions";
import { Post, Blog, Author, Tag } from '../models';

export interface DevBlogsScraperOptions extends ScraperOptions {
  readonly url: string;
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
    const response = await axios.get(this.options.url);
    const $ = cheerio.load(response.data);

    const blogElement = $('h1.herotitle');
    const blogTitle = blogElement.text().trim();
    if (!blogTitle) {
      throw new Error('Failed to parse blog. Title is empty.')
    }

    const blog: Blog = {
      title: blogTitle,
      link: this.options.url,
    };

    const elements = $('#content .entry-box')
      .map((_, element) => $(element))
      .toArray();

    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];

      const titleElement = element.find('.entry-title a');
      const title = titleElement.text().trim();
      if (!title) {
        throw new Error(`Failed to parse post at index ${index}. Title is empty.`)
      }

      const link = titleElement.attr('href');
      if (!link) {
        throw new Error(`Failed to parse post at index ${index}. Link is empty.`)
      }

      const imageElement = element.find('.entry-image img');
      const image = imageElement.attr('data-src');
      if (!image) {
        throw new Error(`Failed to parse post at index ${index}. Image is empty.`)
      }

      const dateElement = element.find('.entry-post-date');
      const dateText = dateElement.text().trim();
      if (!dateText) {
        throw new Error(`Failed to parse post at index ${index}. Date is empty.`)
      }

      const date = new Date(dateText);
      if (isNaN(date.valueOf())) {
        throw new Error(`Failed to parse post at index ${index}. Date is NaN.`)
      }

      const authorElement = element.find('.entry-author-link a');
      const authorTitle = authorElement.text().trim();
      if (!authorTitle) {
        throw new Error(`Failed to parse post at index ${index}. Author title is empty.`)
      }

      const authorLink = authorElement.attr('href');
      if (!authorLink) {
        throw new Error(`Failed to parse post at index ${index}. Author link is empty.`)
      }

      const author: Author = {
        title: authorTitle,
        link: authorLink,
      }

      const description = element
        .find('.entry-content').contents()
        .filter(function (index, element) {
          return this.type == 'text';
        })
        .text().trim();

      var tagElements = element
        .find('.card-tags-links .card-tags-linkbox a')
        .map((_, element) => $(element))
        .toArray();

      var tags = new Array<Tag>();
      for (const tagElement of tagElements) {
        var tagTitle = tagElement.text().trim();
        if (!tagTitle) {
          throw new Error(`Failed to parse post at index ${index}. Tag title is empty.`)
        }

        var tagLink = tagElement.attr('href');
        if (!tagLink) {
          throw new Error(`Failed to parse post at index ${index}. Tag link is empty.`)
        }

        tags.push({
          title: tagTitle,
          link: tagLink,
        })
      }

      yield {
        title,
        link,
        image,
        date,
        blog,
        author,
        description,
        tags,
      }
    }
  }
}
