import { Sender } from './abstractions';
import { Post } from '../models';

export class ValidateSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async sendPost(post: Post): Promise<void> {
    const errors = [];

    if (post.image != undefined) {
      if (!post.image) {
        errors.push('image is empty');
      }
      else if (!post.image.startsWith('https://')) {
        errors.push('image is not valid url');
      }
      else {
        const valid =
          post.image.endsWith('.png') ||
          post.image.endsWith('.jpg') ||
          post.image.endsWith('.jpeg') ||
          post.image.endsWith('.gif');

        if (!valid) {
          errors.push('image has not valid extension');
        }
      }
    }

    if (!post.title) {
      errors.push('title is empty');
    }

    if (!post.link) {
      errors.push('link is empty');
    }
    else if (!post.link.startsWith('https://')) {
      errors.push('link is not valid url');
    }

    if (post.blog) {
      if (!post.blog.title) {
        errors.push('blog title is empty');
      }

      if (!post.blog.link) {
        errors.push('blog link is empty');
      }
      else if (!post.blog.link.startsWith('https://')) {
        errors.push('blog link is not valid url');
      }
    }

    if (post.author) {
      if (!post.author.title) {
        errors.push('author title is empty');
      }

      if (!post.author.link) {
        errors.push('author link is empty');
      }
      else if (!post.author.link.startsWith('https://')) {
        errors.push('author link is not valid url');
      }
    }

    if (post.date) {
      const time = post.date.getTime();
      if (isNaN(time)) {
        errors.push('date is not valid');
      }
    }

    if (post.description != undefined) {
      if (Array.isArray(post.description)) {
        for (const description of post.description) {
          if (!description) {
            errors.push('description is empty');
            break;
          }
        }
      }
      else {
        if (!post.description) {
          errors.push('description is empty');
        }
      }
    }

    if (post.tags) {
      for (let index = 0; index < post.tags.length; index++) {
        const tag = post.tags[index];

        if (!tag.title) {
          errors.push(`tag title at index ${index} is empty`);
        }

        if (!tag.link) {
          errors.push(`tag link at index ${index} is empty`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error('Post is not valid: ' + errors.join(', ') + '.');
    }

    await this.sender.sendPost(post);
  }
}
