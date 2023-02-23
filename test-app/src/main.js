import customResolvers from './custom-resolvers.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';

hydrateApp({ customResolvers });
