import { Link } from '@core/models';
import { MaveEpisodeData, MavePodcastData, MaveScraperBase } from '@core/scrapers/shared';

export class RadioDotNetScraper extends MaveScraperBase {
  constructor() {
    super('radiodotnet', {
      name: 'RadioDotNet',
      title: 'RadioDotNet',
      image: 'https://avatars.yandex.net/get-music-content/4406810/d5e4b859.a.12041961-2/600x600',
      storage: 'https://cdn.mave.digital'
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
