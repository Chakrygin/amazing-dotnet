import * as dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config({
  path: path.join(os.homedir(), 'amazing.env'),
});
