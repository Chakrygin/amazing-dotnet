import fs from 'fs';

export class PostStorageFile {
  constructor(
    private readonly path: string) { }

  private values?: Set<string>;
  private dirty?: true;

  get size() {
    const values = this.getValues();
    return values.size;
  }

  has(value: string): boolean {
    const values = this.getValues();
    return values.has(value);
  }

  add(value: string): void {
    const values = this.getValues();
    values.add(value);
    this.dirty = true;
  }

  private getValues(): NonNullable<typeof this.values> {
    if (!this.values) {
      this.values = new Set();

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

  delete(): void {
    fs.rmSync(this.path, {
      force: true,
    });
  }
}
