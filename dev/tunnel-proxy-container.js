import { isMac, noop } from './helpers.js';
import { DEFAULT_STARTUP_GRACE_PERIOD, DockerContainer } from './docker-container.js';

const DEFAULT_TUNNEL_PROXY_IMAGE = 'educandu/inlets:1.0.0';
const DEFAULT_TUNNEL_PROXY_CONTAINER_NAME = 'tunnel-proxy';

export class TunnelProxyContainer extends DockerContainer {
  constructor({
    tunnelToken,
    tunnelDomain,
    localPort,
    name = DEFAULT_TUNNEL_PROXY_CONTAINER_NAME,
    image = DEFAULT_TUNNEL_PROXY_IMAGE,
    env = {},
    onFirstRun = noop,
    startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD
  }) {
    super({
      name,
      image,
      startupGracePeriod,
      env,
      netHost: !isMac(),
      cmd: [
        'client',
        '--token',
        tunnelToken,
        '--url',
        `wss://${tunnelDomain}`,
        '--upstream',
        `http://${isMac() ? 'host.docker.internal' : 'localhost'}:${localPort}`
      ],
      onFirstRun
    });
  }
}
