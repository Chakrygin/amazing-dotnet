import Reporter from './Reporter';
import TelegramReporter from './TelegramReporter';

export function createReporter(token: string, chatId: string): Reporter {
  return new TelegramReporter(token, chatId);
}
