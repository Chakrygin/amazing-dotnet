import Sender from './Sender';

import TelegramSender from './TelegramSender';
import ThrottleSender from './ThrottleSender';
import ValidateSender from './ValidateSender';

export function createTelegramSender(token: string, chatId: string): Sender {
  let sender: Sender;

  sender = new TelegramSender(token, chatId);
  sender = new ThrottleSender(sender, 5000);
  sender = new ValidateSender(sender);

  return sender;
}
