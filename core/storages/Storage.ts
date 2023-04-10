export interface Storage {
  has(href: string): boolean;
  add(href: string): void;
}
