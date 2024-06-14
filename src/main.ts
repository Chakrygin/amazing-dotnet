import { App } from '@core/App';

import { AndrewLockScraper } from './scrapers/AndrewLockScraper';
import { CodeMazeScraper } from './scrapers/CodeMazeScraper';
import { CodeOpinionScraper } from './scrapers/CodeOpinionScraper';
import { DevBlogsScraper } from './scrapers/DevBlogsScraper';
import { HabrScraper } from './scrapers/HabrScraper';
import { JetBrainsBlogScraper } from './scrapers/JetBrainsBlogScraper';
import { KhalidAbuhakmehScraper } from './scrapers/KhalidAbuhakmehScraper';
import { MeziantouScraper } from './scrapers/MeziantouScraper';
import { RadioDotNetScraper } from './scrapers/RadioDotNetScraper';
import { StevenGieselScraper } from './scrapers/StevenGieselScraper';
import { TheMorningBrewScraper } from './scrapers/TheMorningBrewScraper';

const app = new App(knownHosts => [
  new AndrewLockScraper(),
  new CodeMazeScraper(knownHosts),
  new CodeOpinionScraper(),
  new DevBlogsScraper('dotnet'),
  new DevBlogsScraper('odata'),
  new DevBlogsScraper('nuget'),
  new DevBlogsScraper('typescript'),
  new DevBlogsScraper('visualstudio'),
  new DevBlogsScraper('commandline'),
  new HabrScraper('net'),
  new HabrScraper('csharp'),
  new HabrScraper('fsharp'),
  new JetBrainsBlogScraper('how-tos'),
  new JetBrainsBlogScraper('releases'),
  new JetBrainsBlogScraper('dotinsights', knownHosts),
  new KhalidAbuhakmehScraper(),
  new MeziantouScraper(),
  new RadioDotNetScraper(),
  new StevenGieselScraper(),
  new TheMorningBrewScraper(knownHosts),
]);

void app.run();
