export interface StatusNotifier {
  sync(source?: string): Promise<void>;
}
