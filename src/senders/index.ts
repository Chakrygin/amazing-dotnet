import Sender from './Sender';
import CompositeSender from './CompositeSender';
import ConsoleSender from './ConsoleSender';
import NormalizeSender from './NormalizeSender';
import TelegramSender from './TelegramSender';
import ThrottleSender from './ThrottleSender';
import ValidateSender from './ValidateSender';

const THROTTLE_TIMEOUT = 5000;

export function createSender(token: string, chatId: string): Sender {
  return new NormalizeSender(
    new CompositeSender([
      new ConsoleSender(),
      new ValidateSender(
        new ThrottleSender(
          new TelegramSender(token, chatId),
          THROTTLE_TIMEOUT
        )
      ),
    ])
  );
}
