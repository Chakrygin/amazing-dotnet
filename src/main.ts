import { App } from '../core/App';

import { AndrewLockScraper } from './scrapers/AndrewLockScraper';
import { CodeMazeScraper } from './scrapers/CodeMazeScraper';

const app = new App(knownHosts => [
  new AndrewLockScraper(),
  new CodeMazeScraper(knownHosts),
  // new CodeOpinionScraper(),
  // new DevBlogsScraper('dotnet'),
  // new DevBlogsScraper('odata'),
  // new DevBlogsScraper('nuget'),
  // new DevBlogsScraper('typescript'),
  // new DevBlogsScraper('visualstudio'),
  // new DevBlogsScraper('commandline'),
  // new DotNetCoreTutorialsScraper(),
  // new EnterpriseCraftsmanshipScraper(),
  // new HabrScraper('csharp'),
  // new HabrScraper('fsharp'),
  // new HabrScraper('snet'),
  // new JetBrainsScraper('how-tos'),
  // new JetBrainsScraper('releases'),
  // new JetBrainsScraper('net-annotated', knownHosts),
  // new KhalidAbuhakmehScraper(),
  // new MaoniScraper(),
  // new MeziantouScraper(),
  // new RadioDotNetScraper(),
  // new TheMorningBrewScraper(knownHosts),
]);

void app.run();
