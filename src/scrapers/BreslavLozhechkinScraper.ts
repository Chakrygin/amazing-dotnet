import { Link } from '@core/models';
import { MaveEpisodeData, MavePodcastData, MaveScraperBase } from '@core/scrapers/shared';

export class BreslavLozhechkinScraper extends MaveScraperBase {
  constructor() {
    super('breslav-lozhechkin', {
      name: 'BreslavLozhechkin',
      title: 'Бреслав и Ложечкин',
      storage: 'https://ru-msk-dr3-1.store.cloud.mts.ru/mave'
    });
  }

  protected override getDescription(episode: MaveEpisodeData): string[] | undefined {
    const description: string[] = [];

    const lines = this.getDescriptionLines(episode);

    let flag = true;
    let links: string[] | null = null;

    for (const line of lines) {
      if (line.includes('Реклама')) {
        break;
      }

      if (line) {
        if (line.endsWith(':')) {
          if (links) {
            description.push(
              links.join('\n'));

            flag = false;
            links = null;
          }

          links = [line];
        }
        else if (links) {
          links.push(!line.startsWith('—')
            ? `— ${line}`
            : line);
        }
        else if (flag) {
          description.push(line);
        }
        else {
          break;
        }
      }
      else if (links) {
        description.push(
          links.join('\n'));

        flag = false;
        links = null;
      }
    }

    if (links) {
      description.push(
        links.join('\n'));
    }

    if (description.length > 0) {
      return description;
    }
  }

  protected override getLinks(podcast: MavePodcastData, episode: MaveEpisodeData): Link[] {
    const links = this.getDefaultLinks(podcast, episode);
    const mave = links.pop();

    links.push({
      title: 'Слушать на YouTube',
      href: 'https://www.youtube.com/playlist?list=PLNSmyatBJig64AjlwZrYIgjPwiTsHQNf_',
    });

    if (mave) {
      links.push(mave);
    }

    links.push({
      title: 'Обсудить выпуск',
      href: 'https://t.me/breslavandlozhechkin',
    });

    return links;
  }
}
