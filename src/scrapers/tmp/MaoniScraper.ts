// import * as cheerio from 'cheerio';
// import moment from 'moment';

// import { Link, Post } from '../../core/models';
// import { HtmlPageScraper } from '../../core/scrapers';

// export class MaoniScraper extends HtmlPageScraper {
//   readonly name = 'Maoni';
//   readonly path = 'maoni0.medium.com';

//   private readonly Maoni: Link = {
//     title: 'Maoni Stephens',
//     href: 'https://maoni0.medium.com',
//   };

//   protected override fetchPosts(): AsyncGenerator<Post> {
//     return this
//       .fromHtmlPage(this.Maoni.href)
//       .fetchPosts(MaoniFetchReader, reader => {
//         const post: Post = {
//           title: reader.title,
//           href: this.getFullHref(reader.href),
//           categories: [
//             this.Maoni,
//           ],
//           date: moment(reader.date, 'LL'),
//           links: [
//             {
//               title: 'Read more',
//               href: this.getFullHref(reader.href),
//             },
//           ],
//         };

//         return post;
//       });
//   }

//   protected override enrichPost(post: Post): Promise<Post | undefined> {
//     return this
//       .fromHtmlPage(post.href)
//       .enrichPost(MaoniEnrichReader, reader => {
//         post = {
//           ...post,
//           description: reader.getDescription(),
//         };

//         return post;
//       });
//   }

//   private getFullHref(href: string): string {
//     const index = href.indexOf('?');
//     if (index > 0) {
//       href = href.substring(0, index);
//     }

//     if (href.startsWith('/')) {
//       href = this.Maoni.href + href;
//     }

//     return href;
//   }
// }

// class MaoniFetchReader {
//   constructor(
//     private readonly $: cheerio.CheerioAPI,
//     private readonly article: cheerio.Cheerio<cheerio.Element>) { }

//   static readonly selector = 'main article';

//   readonly header = this.article.find('h2');
//   readonly title = this.header.text();
//   readonly link = this.header.parents('a').first();
//   readonly href = this.link.attr('href') ?? '';
//   readonly date = this.article.find('a>p>span').text();
// }

// class MaoniEnrichReader {
//   constructor(
//     private readonly $: cheerio.CheerioAPI,
//     private readonly article: cheerio.Cheerio<cheerio.Element>) { }

//   static readonly selector = 'main article';

//   getDescription(): string[] {
//     const description: string[] = [];
//     const elements = this.article
//       .find('section p.pw-post-body-paragraph')
//       .first()
//       .parent()
//       .children();

//     for (const element of elements) {
//       if (element.name == 'p') {
//         const p = this.$(element);

//         if (p.hasClass('pw-post-body-paragraph')) {
//           const text = p.text().trim();

//           if (text) {
//             description.push(text);

//             if (description.length >= 5) {
//               break;
//             }
//           }
//         }
//         else if (description.length > 0) {
//           break;
//         }
//       }
//       else if (description.length > 0) {
//         break;
//       }
//     }

//     return description;
//   }
// }
