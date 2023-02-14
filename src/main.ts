import { App } from 'core';

import AndrewLockScraper from './scrapers/AndrewLockScraper';
import CodeMazeScraper from './scrapers/CodeMazeScraper';
import CodeOpinionScraper from './scrapers/CodeOpinionScraper';
import DevBlogsScraper from './scrapers/DevBlogsScraper';
import DotNetCoreTutorialsScraper from './scrapers/DotNetCoreTutorialsScraper';
import HabrScraper from './scrapers/HabrScraper';
import JetBrainsScraper from './scrapers/JetBrainsScraper';
import KhalidAbuhakmehScraper from './scrapers/KhalidAbuhakmehScraper';
import MaoniScraper from './scrapers/MaoniScraper';
import MeziantouScraper from './scrapers/MeziantouScraper';
import RadioDotNetScraper from './scrapers/RadioDotNetScraper';
import TheMorningBrewScraper from './scrapers/TheMorningBrewScraper';

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
  new DotNetCoreTutorialsScraper(),
  new HabrScraper('csharp'),
  new HabrScraper('fsharp'),
  new HabrScraper('net'),
  new JetBrainsScraper('how-tos'),
  new JetBrainsScraper('releases'),
  new JetBrainsScraper('net-annotated', knownHosts),
  new KhalidAbuhakmehScraper(),
  new MaoniScraper(),
  new MeziantouScraper(),
  new RadioDotNetScraper(),
  new TheMorningBrewScraper(knownHosts),
]);

void app.run();
