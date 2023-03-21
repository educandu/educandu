class RegisteredPlugin {
  constructor(name, info) {
    this.name = name;
    this.info = info;
    this.editorComponent = null;
    this.displayComponent = null;
  }

  async ensureDisplayComponentIsLoaded() {
    this.displayComponent = await this.info.resolveDisplayComponent();
  }

  async ensureEditorComponentIsLoaded() {
    this.editorComponent = await this.info.resolveEditorComponent();
  }
}

export default RegisteredPlugin;
