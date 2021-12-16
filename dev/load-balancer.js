import http from 'http';
import httpProxy from 'http-proxy';
import { noop } from './helpers.js';

export class LoadBalancer {
  constructor({ port, targets, onProxy = noop }) {
    this.port = port;
    this.targets = targets;
    this.onProxy = onProxy;
    this._cursor = targets.length - 1;
    this._proxy = null;
    this._server = null;
  }

  _getNextTarget() {
    const nextIndex = (this._cursor + 1) % this.targets.length;
    this._cursor = nextIndex;
    return { index: nextIndex, target: this.targets[nextIndex] };
  }

  start() {
    this._proxy = httpProxy.createProxyServer({});
    this._proxy.on('proxyRes', (proxyRes, req) => {
      proxyRes.headers['x-proxy-target'] = req.targetIndex;
    });
    return new Promise((resolve, reject) => {
      this._server = http.createServer((req, res) => {
        const { index, target } = this._getNextTarget();
        req.targetIndex = `#${index}`;
        this.onProxy({ index, target, req });
        this._proxy.web(req, res, { target });
      });
      this._server.listen(this.port, err => err ? reject(err) : resolve());
    });
  }

  async stop() {
    await new Promise((resolve, reject) => {
      this._server.close(err => err ? reject(err) : resolve());
    });
    this._proxy = null;
    this._server = null;
  }
}
