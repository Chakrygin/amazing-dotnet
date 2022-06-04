import * as core from '@actions/core';

import Sender from './Sender';

import { Post } from '../models';

export default class ConsoleSender implements Sender {
  async send(post: Post): Promise<void> {
    const json = JSON.stringify(post, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');

    core.info('\n' + json + '\n');
  }
}
