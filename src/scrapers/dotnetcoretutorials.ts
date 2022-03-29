import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "./abstractions";
import { Sender } from "../senders/abstractions";
import { Storage } from "../storage";
import { Author, Blog, Post, Tag } from "../models";

export class DotNetCoreTutorialsScraper implements Scraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';

  private readonly blog: Blog = {
    title: '.NET Core Tutorials',
    link: 'https://dotnetcoretutorials.com/'
  }

  private readonly author: Author = {
    title: 'Wade Gausden',
    link: 'https://dotnetcoretutorials.com/about/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        break;
      }

      await sender.sendPost(post);

      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    //     const response = await axios.get(blog.link);
    //     const $ = cheerio.load(response.data);

    //     const articles = $('#content article').toArray();

    //     for (let index = 0; index < articles.length; index++) {
    //       const article = $(articles[index]);

    //       const title = article.find('h2 a');
    //       const titleText = title.text();
    //       const titleHref = title.attr('href');

    //       console.log(titleText);
    //       console.log(titleHref);
    //       console.log();

    //       const content = article.find('.entry-content');

    //       const items = content.children;

    //       for (const item of content.contents()) {
    //         const txt = $(item).text();

    //         console.log(txt);
    //         console.log();
    //       }

    //       console.log();
    //     }
  }
}
