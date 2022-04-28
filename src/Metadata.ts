import moment from 'moment';

import fs from 'fs';
import { join } from 'path';

export interface LastUpdate {
  readonly timestamp: moment.Moment;
  readonly idle?: true;
}

export interface LastError {
  readonly timestamp: moment.Moment;
  readonly message: string;
  readonly counter: number;
}

export default class Metadata {
  private readonly path = join(process.cwd(), 'data', 'metadata.json');
  private metadata?: Map<string, MetadataItem>;

  getLastUpdate(name: string): LastUpdate | undefined {
    const item = this.getMetadataItem(name);
    return item?.lastUpdate;
  }

  setLastUpdateIdle(name: string): void {
    const item = this.getMetadataItem(name);
    if (item && item.lastUpdate) {
      item.lastUpdate = {
        timestamp: item.lastUpdate.timestamp,
        idle: true,
      };
    }
  }

  setLastUpdate(name: string): void {
    const item = this.getOrSetMetadataItem(name);
    item.lastUpdate = {
      timestamp: moment(),
    };
  }

  getLastError(name: string): LastError | undefined {
    const item = this.getMetadataItem(name);
    return item?.lastError;
  }

  resetLastError(name: string): void {
    const item = this.getMetadataItem(name);
    if (item) {
      item.lastError = undefined;
    }
  }

  setLastError(name: string, error: string | Error): void {
    const item = this.getOrSetMetadataItem(name);
    item.lastError = {
      timestamp: moment(),
      message: error.toString(),
      counter: item.lastErrorCounter + 1,
    };
  }

  private getMetadataItem(name: string): MetadataItem | undefined {
    const metadata = this.getMetadata();
    const item = metadata.get(name);

    return item;
  }

  private getOrSetMetadataItem(name: string): MetadataItem {
    const metadata = this.getMetadata();

    let item = metadata.get(name);
    if (!item) {
      item = { lastErrorCounter: 0 };
      metadata.set(name, item);
    }

    return item;
  }

  private getMetadata(): NonNullable<typeof this.metadata> {
    if (!this.metadata) {
      this.metadata = new Map();

      if (fs.existsSync(this.path)) {
        const text = fs.readFileSync(this.path).toString();
        const json = JSON.parse(text) as {
          readonly [name: string]: {
            readonly lastUpdate?: {
              readonly timestamp: string;
              readonly idle?: true;
            }
            readonly lastError?: {
              readonly timestamp: string;
              readonly message: string;
              readonly counter: number;
            }
          };
        };

        const entries = Object.entries(json);
        for (const [name, entry] of entries) {
          const item: MetadataItem = {
            lastErrorCounter: 0,
          };

          if (entry.lastUpdate) {
            item.lastUpdate = {
              timestamp: moment(entry.lastUpdate.timestamp),
              idle: entry.lastUpdate.idle,
            };
          }

          if (entry.lastError) {
            item.lastError = {
              timestamp: moment(entry.lastError.timestamp),
              message: entry.lastError.message,
              counter: entry.lastError.counter,
            };

            item.lastErrorCounter = entry.lastError.counter;
          }

          this.metadata.set(name, item);
        }
      }
    }

    return this.metadata;
  }

  save() {
    const metadata = this.getMetadata();
    const entries = Array.from(metadata.entries())
      .filter(([_, item]) => item.lastUpdate || item.lastError)
      .map(([name, item]) => [name, {
        lastUpdate: mapLastUpdate(item.lastUpdate),
        lastError: mapLastError(item.lastError),
      }]);

    const json = Object.fromEntries(entries);
    const text = JSON.stringify(json, null, 2);
    fs.writeFileSync(this.path, text + '\n');

    delete this.metadata;

    function mapLastUpdate(lastUpdate?: LastUpdate): object | undefined {
      if (lastUpdate) {
        return {
          timestamp: lastUpdate.timestamp.toISOString(),
          idle: lastUpdate.idle,
        };
      }
    }

    function mapLastError(lastError?: LastError): object | undefined {
      if (lastError) {
        return {
          timestamp: lastError.timestamp.toISOString(),
          message: lastError.message,
          counter: lastError.counter,
        };
      }
    }
  }
}

interface MetadataItem {
  lastUpdate?: LastUpdate;
  lastError?: LastError;
  lastErrorCounter: number;
}
