import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart } from './types';

export class MapsExplorerDashboardsPlugin
  implements Plugin<MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('mapsExplorerDashboards: Setup');

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('mapsExplorerDashboards: Started');
    return {};
  }

  public stop() {}
}
