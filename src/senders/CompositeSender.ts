import { Post } from '../models';
import Sender from './Sender';

export default class CompositeSender implements Sender {
  constructor(
    private readonly senders: Sender[]) { }

  async send(post: Post): Promise<void> {
    for (const sender of this.senders) {
      await sender.send(post);
    }
  }
}
