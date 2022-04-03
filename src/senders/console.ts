import * as core from '@actions/core'

import { Sender } from '../senders';
import { Post } from '../models';

export class ConsoleSender implements Sender {
  async sendPost(post: Post): Promise<void> {
    this.print('Post', post);
  }

  private print(name: string, value: any): void {
    const json = JSON.stringify(value, null, 2);
    core.info(`${name}: ${json}\n`);
  }
}
