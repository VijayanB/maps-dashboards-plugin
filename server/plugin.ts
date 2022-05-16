import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { MapsDashboardsPluginPluginSetup, MapsDashboardsPluginPluginStart } from './types';
import { defineRoutes } from './routes';

export class MapsDashboardsPluginPlugin
  implements Plugin<MapsDashboardsPluginPluginSetup, MapsDashboardsPluginPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('mapsDashboardsPlugin: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('mapsDashboardsPlugin: Started');
    return {};
  }

  public stop() {}
}
