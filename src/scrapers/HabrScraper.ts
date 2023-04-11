import { HabrScraperBase } from '../../core/scrapers/shared';

const Hubs = {
  'net': '.NET',
  'csharp': 'C#',
  'fsharp': 'F#',
};

export class HabrScraper extends HabrScraperBase {
  constructor(hubId: keyof typeof Hubs) {
    super(hubId, Hubs[hubId], {
      minRating: 10,
    });
  }
}
