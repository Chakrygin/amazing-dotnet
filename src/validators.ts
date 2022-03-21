import { Post } from './models'

export function validatePost(post: Post): void {
  var errors = [];

  if (!post.title) {
    errors.push('title is empty');
  }

  if (!post.link) {
    errors.push('link is empty');
  }
  else if (!post.link.startsWith('https://')) {
    errors.push('link is not valid url');
  }

  if (!post.image) {
    errors.push('image is empty');
  }
  else if (!post.image.startsWith('https://')) {
    errors.push('image is not valid url');
  }

  if (isNaN(post.date.valueOf())) {
    errors.push('date is not valid');
  }

  if (!post.blog.title) {
    errors.push('blog title is empty');
  }

  if (!post.blog.link) {
    errors.push('blog link is empty');
  }
  else if (!post.blog.link.startsWith('https://')) {
    errors.push('blog link is not valid url');
  }

  if (!post.author.title) {
    errors.push('author title is empty');
  }

  if (!post.author.link) {
    errors.push('author link is empty');
  }
  else if (!post.author.link.startsWith('https://')) {
    errors.push('author link is not valid url');
  }

  if (post.description.length == 0) {
    errors.push('description is empty');
  }
  else {
    for (const description of post.description) {
      if (!description) {
        errors.push('description is empty');
        break;
      }
    }
  }

  for (let index = 0; index < post.tags.length; index++) {
    const tag = post.tags[index];

    if (!tag.title) {
      errors.push(`tag title is empty at index ${index}`);
    }

    if (!tag.link) {
      errors.push(`tag link is empty at index ${index}`);
    }
  }

  if (errors.length > 0) {
    throw new Error('Post is not valid: ' + errors.join(', ') + '.');
  }
}
