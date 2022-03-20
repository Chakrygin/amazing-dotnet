import { Post } from './models'

export interface Scraper {
  scrape(sender: Sender): Promise<void>;
}

export interface Sender {
  sendPost(post: Post): Promise<void>;
}
