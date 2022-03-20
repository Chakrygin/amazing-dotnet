import { Post } from '../models'
import { Sender } from '../abstractions';

export class ConsoleSender implements Sender {
  async sendPost(post: Post): Promise<void> {
    this.print('Post', post);
  }

  async sendError(title: string, error: string | Error): Promise<void> {
    this.print('Error', { title, error });
  }

  private print(name: string, value: any): void {
    const json = JSON.stringify(value, null, 2);
    console.log(`${name}: ${json}`);
    console.log();
  }
}
