import { Sender } from './Sender';
import { Post } from '../models';

export class ThrottleSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  private delay = Promise.resolve();

  async send(post: Post): Promise<void> {
    await this.delay;
    await this.sender.send(post);

    this.delay = new Promise<void>(resolve => setTimeout(resolve, 5000));
  }
}
