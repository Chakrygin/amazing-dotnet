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

    for await (const post of this.readPosts()) {
      this.printPost(post);

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

      const enrichedPost = await this.enrichPost(post);

      if (enrichedPost) {
        this.printPostJson(enrichedPost);

        core.info('Sending the post...');
        await sender.send(enrichedPost);

        core.info('Storing the post...');
        storage.add(enrichedPost.href);
      }
    }
  }

  protected abstract readPosts(): AsyncGenerator<Post>;

  protected enrichPost(post: Post): Promise<Post | undefined> {
    return Promise.resolve(post);
  }

  protected printPost(post: Post): void {
    core.info(`Post title is '${post.title}'.`);
    core.info(`Post href is '${post.href}'.`);
  }

  protected printPostJson(post: Post): void {
    const json = JSON.stringify(post, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');

    core.info('Post is \n' + json + '\n');
  }
}
