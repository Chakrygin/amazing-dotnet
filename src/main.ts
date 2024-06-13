import { App } from '@core/App';

import { AndrewLockScraper } from './scrapers/AndrewLockScraper';
// import { CodeMazeScraper } from './scrapers/CodeMazeScraper';
// import { CodeOpinionScraperV2 } from './scrapers/CodeOpinionScraperV2';
import { DevBlogsScraper } from './scrapers/DevBlogsScraper';
// import { EnterpriseCraftsmanshipScraper } from './scrapers/EnterpriseCraftsmanshipScraper';
// import { HaackedScraper } from './scrapers/HaackedScraper';
// import { HabrScraper } from './scrapers/HabrScraper';
// import { JetBrainsBlogScraper } from './scrapers/JetBrainsBlogScraper';
// import { KhalidAbuhakmehScraper } from './scrapers/KhalidAbuhakmehScraper';
// // import { MaoniScraper } from './scrapers/MaoniScraper';
// import { MeziantouScraper } from './scrapers/MeziantouScraper';
// import { MichaelsCodingSpotScraper } from './scrapers/MichaelsCodingSpotScraper';
// import { RadioDotNetScraper } from './scrapers/RadioDotNetScraper';
// import { StevenGieselScraper } from './scrapers/StevenGieselScraper';
// import { TheMorningBrewScraper } from './scrapers/TheMorningBrewScraper';

const app = new App(knownHosts => [
  new AndrewLockScraper(),
  // new CodeMazeScraper(knownHosts),
  // new CodeOpinionScraperV2(),
  new DevBlogsScraper('dotnet'),
  new DevBlogsScraper('odata'),
  new DevBlogsScraper('nuget'),
  new DevBlogsScraper('typescript'),
  new DevBlogsScraper('visualstudio'),
  new DevBlogsScraper('commandline'),
  // new EnterpriseCraftsmanshipScraper(),
  // new HaackedScraper(),
  // new HabrScraper('net'),
  // new HabrScraper('csharp'),
  // new HabrScraper('fsharp'),
  // new JetBrainsBlogScraper('how-tos'),
  // new JetBrainsBlogScraper('releases'),
  // new JetBrainsBlogScraper('net-annotated', knownHosts),
  // new KhalidAbuhakmehScraper(),
  // // new MaoniScraper(),
  // new MeziantouScraper(),
  // new MichaelsCodingSpotScraper(),
  // new RadioDotNetScraper(),
  // new StevenGieselScraper(),
  // new TheMorningBrewScraper(knownHosts),
]);

void app.run();
