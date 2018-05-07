const bootstrapper = require('../bootstrap/client-bootstrapper');
const ClientRendererFactory = require('../plugins/client-renderer-factory');

document.addEventListener('DOMContentLoaded', async () => {
  const initialState = window.__initalState__;

  const container = await bootstrapper.createContainer();

  const clientRendererFactory = container.get(ClientRendererFactory);

  initialState.sections.forEach(section => {
    const plugin = clientRendererFactory.createRenderer(section.type);
    if (plugin) {
      const parentElement = document.body.querySelector(`[data-section-id="${section._id}"]`);
      plugin.init(parentElement);
    }
  });
});
