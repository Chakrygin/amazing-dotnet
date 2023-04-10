import { Post } from '../models';

export interface Sender {
  send(post: Post): Promise<void>;
}
