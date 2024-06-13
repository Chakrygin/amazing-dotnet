import { HabrScraperBase } from '@core/scrapers/shared';

const hubs = {
  'net': '.NET',
  'csharp': 'C#',
  'fsharp': 'F#',
};

export class HabrScraper extends HabrScraperBase {
  constructor(id: keyof typeof hubs) {
    super(id, hubs[id], {
      minRating: 10,
    });
  }
}
