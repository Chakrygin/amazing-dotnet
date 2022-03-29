import { Post } from "../models";

export interface Sender {
  sendPost(post: Post): Promise<void>;
}
