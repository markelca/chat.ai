import { OutputView } from './OutputView.js';

/**
 * Composite pattern implementation for OutputView.
 * Broadcasts all output to multiple view backends simultaneously.
 *
 * Useful for dual output scenarios (e.g., stdout + Redis pub/sub).
 */
export class CompositeView extends OutputView {
  private views: OutputView[];

  constructor(views: OutputView[]) {
    super();
    this.views = views;
  }

  async displayWelcome(providerName: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayWelcome(providerName))
    );
  }

  async displayHelp(): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayHelp())
    );
  }

  async displayCommandHelp(): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayCommandHelp())
    );
  }

  async displayPrompt(promptText: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayPrompt(promptText))
    );
  }

  async streamChunk(chunk: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.streamChunk(chunk))
    );
  }

  async streamComplete(): Promise<void> {
    await Promise.all(
      this.views.map(view => view.streamComplete())
    );
  }

  async displayError(error: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayError(error))
    );
  }

  async displayInfo(message: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayInfo(message))
    );
  }

  async displayWarning(message: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displayWarning(message))
    );
  }

  async displaySystemMessage(message: string): Promise<void> {
    await Promise.all(
      this.views.map(view => view.displaySystemMessage(message))
    );
  }
}
