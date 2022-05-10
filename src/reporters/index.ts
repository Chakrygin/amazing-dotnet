import Reporter from './Reporter';
import TelegramReporter from './TelegramReporter';

export function createTelegramReporter(token: string, chatId: string): Reporter {
  return new TelegramReporter(token, chatId);
}
