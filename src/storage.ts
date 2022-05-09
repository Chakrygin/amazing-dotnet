import { join } from 'path';
import fs from 'fs';
import moment from 'moment';

export default class Storage {
  constructor(path: string) {
    this.path = join(process.cwd(), 'data', path);
  }

  private readonly path: string;

  private files?: Map<string, StorageFile>;
  private names?: string[];

  exists(): boolean {
    const path = join(this.path, 'timestamp');
    return fs.existsSync(path);
  }

  has(value: string): boolean;
  has(value: string, date: moment.Moment): boolean;
  has(value: string, date?: moment.Moment): boolean {
    if (date) {
      const name = this.getFileName(date);
      const file = this.getFile(name);

      return file.has(value);
    }
    else {
      const names = this.getFileNames();
      for (const name of names) {
        const file = this.getFile(name);

        if (file.has(value)) {
          return true;
        }
      }

      return false;
    }
  }

  add(value: string): void;
  add(value: string, date: moment.Moment): void;
  add(value: string, date?: moment.Moment): void {
    const name = this.getFileName(date ?? moment());
    const file = this.getFile(name);

    file.add(value);
  }

  private getFileName(date: moment.Moment): string {
    if (!date.isValid()) {
      throw new Error('Invalid date.');
    }

    return date.toISOString().substring(0, 7) + '.txt';
  }

  private getFile(name: string) {
    if (!this.files) {
      this.files = new Map();
    }

    let file = this.files.get(name);
    if (!file) {
      file = new StorageFile(this.path, name);
      this.files.set(name, file);
    }

    return file;
  }

  private getFileNames(): string[] {
    if (!this.names) {
      if (fs.existsSync(this.path)) {
        const regexp = /^\d{4}-\d{2}.txt$/;

        this.names = fs.readdirSync(this.path)
          .filter(file => regexp.test(file))
          .sort()
          .reverse();
      }
      else {
        this.names = [];
      }
    }

    return this.names;
  }

  save(): boolean {
    let dirty = false;

    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path, {
        recursive: true
      });
    }

    if (this.files) {
      for (const file of this.files.values()) {
        if (file.save()) {
          dirty = true;
        }
      }

      delete this.files;
      delete this.names;
    }

    if (dirty) {
      const path = join(this.path, 'timestamp');
      const data = moment().toISOString();
      fs.writeFileSync(path, data + '\n');
    }

    return dirty;
  }
}

class StorageFile {
  constructor(path: string, name: string) {
    this.path = join(path, name);
  }

  private readonly path: string;

  private values?: Set<string>;
  private dirty?: true;

  has(value: string): boolean {
    const values = this.getValues();
    return values.has(value);
  }

  add(value: string): void {
    const values = this.getValues();
    values.add(value);

    this.dirty = true;
  }

  private getValues(): Set<string> {
    if (!this.values) {
      this.values = new Set<string>();

      if (fs.existsSync(this.path)) {
        const data = fs.readFileSync(this.path).toString();
        const values = data.split('\n')
          .map(value => value.trim())
          .filter(value => !!value);

        for (const value of values) {
          this.values.add(value);
        }
      }
    }

    return this.values;
  }

  save(): boolean {
    let dirty = false;

    if (this.values && this.dirty) {
      const data = Array.from(this.values).sort().join('\n');
      fs.writeFileSync(this.path, data + '\n');

      delete this.values;
      delete this.dirty;

      dirty = true;
    }

    return dirty;
  }
}
