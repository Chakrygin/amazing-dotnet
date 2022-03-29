import { join } from 'path';
import fs from 'fs';

export class Storage {
  constructor(path: string) {
    this.path = join(process.cwd(), 'data', path);
  }

  private readonly path: string;
  private readonly files = new Map<string, StorageFile>();
  private names?: string[];

  exists(): boolean {
    return fs.existsSync(this.path);
  }

  has(value: string, date?: Date): boolean {
    return date
      ? this.hasWithDate(value, date)
      : this.hasWithoutDate(value);
  }

  private hasWithDate(value: string, date: Date): boolean {
    const name = this.getFileName(date);
    const file = this.getFile(name);

    return file.has(value);
  }

  private hasWithoutDate(value: string): boolean {
    const names = this.getFileNames();
    for (const name of names) {
      const file = this.getFile(name);
      const has = file.has(value);
      if (has) {
        return true;
      }
    }

    return false;
  }

  add(value: string, date?: Date): void {
    const name = this.getFileName(date ?? new Date());
    const file = this.getFile(name);

    file.add(value);
  }

  private getFileName(date: Date): string {
    const time = date.getTime();

    if (isNaN(time)) {
      throw new Error('Invalid date.');
    }

    return date.toISOString().substring(0, 7) + '.txt';
  }

  private getFileNames(): string[] {
    if (!this.names) {
      const regexp = /^\d{4}-\d{2}-\d{2}.txt$/;

      this.names = fs.readdirSync(this.path)
        .filter(file => regexp.test(file))
        .sort()
        .reverse();
    }

    return this.names;
  }

  private getFile(name: string) {
    let file = this.files.get(name);
    if (!file) {
      file = new StorageFile(this.path, name);
      this.files.set(name, file);
    }

    return file;
  }

  save() {
    let dirty = false;

    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path, {
        recursive: true
      });
    }

    for (const file of this.files.values()) {
      dirty = file.save() || dirty;
    }

    if (dirty) {
      var path = join(this.path, 'timestamp');
      var data = new Date().toISOString();
      fs.writeFileSync(path, data + '\n');
    }
  }
}

export class StorageFile {
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
        var values = fs.readFileSync(this.path)
          .toString()
          .split('\n')
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
    if (this.values && this.dirty) {
      var data = Array.from(this.values)
        .sort()
        .join('\n');

      fs.writeFileSync(this.path, data + '\n');

      delete this.values;
      delete this.dirty;

      return true;
    }

    return false;
  }
}
