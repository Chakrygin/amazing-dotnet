import moment from 'moment';

export interface Post {
  readonly image?: string;
  readonly title: string;
  readonly href: string;
  readonly categories: Category[];
  readonly date: moment.Moment;
  readonly description?: string[];
  readonly tags?: Tag[];
}

export interface Category {
  readonly title: string;
  readonly href: string;
}

export interface Tag {
  readonly title: string;
  readonly href: string;
}
