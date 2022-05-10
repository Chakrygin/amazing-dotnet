export default interface Reporter {
  report(message: string, error?: string | Error): Promise<void>;
}


