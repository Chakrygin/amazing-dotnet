import { Link } from '@core/models';
import { MaveEpisodeData, MavePodcastData, MaveScraperBase } from '@core/scrapers/shared';

export class RadioDotNetScraper extends MaveScraperBase {
  constructor() {
    super('radiodotnet', {
      name: 'RadioDotNet',
      title: 'RadioDotNet',
      storage: 'https://ru-msk-dr3-1.store.cloud.mts.ru/mave'
    });
  }

  protected override getDescription(episode: MaveEpisodeData): string | undefined {
    const description = [];

    const regexp = /^\[\d{2}:\d{2}:\d{2}\]/;
    const lines = this.getDescriptionLines(episode);

    for (const line of lines) {
      if (regexp.test(line)) {
        description.push(line);
      }
    }

    if (description.length > 0) {
      return description.join('\n');
    }
  }

  protected override getLinks(podcast: MavePodcastData, episode: MaveEpisodeData): Link[] {
    const links = this.getDefaultLinks(podcast, episode);

    links.push({
      title: 'Поддержать на Boosty',
      href: 'https://boosty.to/radiodotnet',
    });

    return links;
  }
}
