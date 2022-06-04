export default interface Reporter {
  reportWarning(title: string, warning: string): Promise<void>;
  reportError(title: string, error: string | Error): Promise<void>;
}
