import { HtmlPageHelper } from './HtmlPageHelper';
import { ScraperBase } from './ScraperBase';

export abstract class HtmlPageScraper extends ScraperBase {
  protected fromHtmlPage(url: string): HtmlPageHelper {
    return new HtmlPageHelper(url);
  }
}
