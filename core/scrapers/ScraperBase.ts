import * as core from '@actions/core';

import moment from 'moment';

import { Scraper } from './Scraper';
import { Post } from '../models';
import { Sender } from '../senders';
import { Storage } from '../storages';

export abstract class ScraperBase implements Scraper {
  abstract name: string;
  abstract path: string;

  async scrape(sender: Sender, storage: Storage): Promise<void> {
    let firstPostDate: moment.Moment | undefined;

    for await (let post of this.readPosts()) {
      core.info(`Post title is '${post.title}'`);
      core.info(`Post href is '${post.href}'`);

      if (storage.has(post.href)) {
        core.info('The post already exists in the storage. Break scraping.');
        break;
      }

      if (!firstPostDate) {
        firstPostDate = post.date;
      }
      else if (firstPostDate.diff(post.date, 'day') >= 1) {
        core.info('The post is too old. Break scraping.');
        break;
      }

      post = await this.enrichPost(post);

      core.info('Sending the post...');
      await sender.send(post);

      core.info('Storing the post...');
      storage.add(post.href);
    }
  }

  protected abstract readPosts(): AsyncGenerator<Post>;

  protected enrichPost(post: Post): Promise<Post> {
    return Promise.resolve(post);
  }
}
