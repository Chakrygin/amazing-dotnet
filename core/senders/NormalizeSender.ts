import { Sender } from './Sender';
import { Post } from '../models';

export class NormalizeSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(post: Post): Promise<void> {
    post = {
      image: post.image?.trim(),
      title: post.title.trim(),
      href: post.href.trim(),
      categories: post.categories
        .map(category => ({
          title: category.title.trim(),
          href: category.href.trim(),
        })),
      author: post.author?.trim(),
      date: post.date,
      description: post.description,
      links: post.links
        .map(link => ({
          title: link.title.trim(),
          href: link.href.trim(),
        })),
      tags: post.tags
        ?.map(tag => tag.trim())
        .sort(),
    };

    await this.sender.send(post);
  }
}
