import Sender from './Sender';

import { Post } from '../models';

export default class ThrottleSender implements Sender {
  constructor(
    private readonly sender: Sender,
    private readonly timeout: number) { }

  private delay = Promise.resolve();

  async send(post: Post): Promise<void> {
    await this.throttle(async () => {
      await this.sender.send(post);
    });
  }

  async throttle(callback: () => Promise<void>): Promise<void> {
    await this.delay;
    await callback();

    this.delay = new Promise<void>(resolve => setTimeout(resolve, this.timeout));
  }
}
