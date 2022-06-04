import * as core from '@actions/core';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Post } from '../models';

export default abstract class ScraperBase implements Scraper {
  abstract readonly name: string;
  abstract readonly path: string;

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (let post of this.readPosts()) {
      if (storage.has(post.href)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      post = await this.enrichPost(post);

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href);
    }
  }

  protected abstract readPosts(): AsyncGenerator<Post, void>;

  protected enrichPost(post: Post): Promise<Post> {
    return Promise.resolve(post);
  }
}
