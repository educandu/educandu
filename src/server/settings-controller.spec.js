import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import SettingsController from './settings-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('settings-controller', () => {
  const sandbox = createSandbox();

  let settingsService;

  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    settingsService = {
      getAllSettings: sandbox.stub(),
      saveSettings: sandbox.stub()
    };

    user = { _id: uniqueId.create() };

    sut = new SettingsController(settingsService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetSettings', () => {
    const settings = { settingsKey: 'some value' };
    beforeEach(() => new Promise((resolve, reject) => {
      settingsService.getAllSettings.resolves(settings);

      req = httpMocks.createRequest({
        user,
        protocol: 'https',
        headers: { host: 'educandu.dev' }
      });

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handleGetSettings(req, res).catch(reject);
    }));

    it('should call getAllSettings', () => {
      assert.calledOnce(settingsService.getAllSettings);
    });

    it('should return the loaded settings', () => {
      expect(res._getData()).toStrictEqual({ settings });
    });
  });

  describe('handlePostSettings', () => {
    const settings = { settingsKey: 'some value' };
    beforeEach(() => new Promise((resolve, reject) => {
      settingsService.getAllSettings.resolves(settings);

      req = httpMocks.createRequest({
        user,
        protocol: 'https',
        headers: { host: 'educandu.dev' },
        body: { settings }
      });

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handlePostSettings(req, res).catch(reject);
    }));

    it('should call saveSettings', () => {
      assert.calledWith(settingsService.saveSettings, settings);
    });

    it('should return the saved settings', () => {
      expect(res._getData()).toStrictEqual({ settings });
    });
  });

});
