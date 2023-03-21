import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

class RegisteredPlugin {
  constructor(name, info, displayComponent = null) {
    this.name = name;
    this.info = info;
    this.editorComponent = null;
    this.displayComponent = displayComponent || null;
  }

  async ensureDisplayComponentIsLoaded() {
    if (!this.displayComponent) {
      logger.warn(`Loading display component asynchronously for plugin ${this.name}`);
      this.displayComponent = await this.info.resolveDisplayComponent();
    }
  }

  async ensureEditorComponentIsLoaded() {
    if (!this.editorComponent) {
      this.editorComponent = await this.info.resolveEditorComponent();
    }
  }
}

export default RegisteredPlugin;
