import moment from 'moment';

import { Link } from './Link';

export interface Post {
  readonly image?: string;
  readonly title: string;
  readonly href: string;
  readonly categories: Link[];
  readonly author?: string;
  readonly date?: moment.Moment;
  readonly description?: string[];
  readonly links: Link[];
  readonly tags?: string[];
}
