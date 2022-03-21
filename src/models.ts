export interface Post {
  readonly title: string;
  readonly link: string;
  readonly image: string;
  readonly date: Date;
  readonly blog: Blog;
  readonly author: Author;
  readonly description: string[];
  readonly tags: Tag[];
}

export interface Blog {
  readonly title: string;
  readonly link: string;
}

export interface Author {
  readonly title: string;
  readonly link: string;
}

export interface Tag {
  readonly title: string;
  readonly link: string;
}

export module Post {
  function validate(post: Post) {
  }
}
