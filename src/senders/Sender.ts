import { Post } from '../models';

export default interface Sender {
  send(post: Post): Promise<void>;
}

