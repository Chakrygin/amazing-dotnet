import { Sender } from '../senders';
import { Post } from '../models';

export class ThrottleSender implements Sender {
  constructor(
    private readonly sender: Sender,
    private readonly timeout: number) { }

  private delay = Promise.resolve();

  async sendPost(post: Post): Promise<void> {
    await this.throttle(async () => {
      await this.sender.sendPost(post);
    });
  }

  async throttle(callback: () => Promise<void>): Promise<void> {
    await this.delay;
    await callback();

    this.delay = new Promise<void>(resolve => setTimeout(resolve, this.timeout));
  }
}
