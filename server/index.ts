import { PluginInitializerContext } from '../../../src/core/server';
import { MapsExplorerDashboardsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new MapsExplorerDashboardsPlugin(initializerContext);
}

export { MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart } from './types';
