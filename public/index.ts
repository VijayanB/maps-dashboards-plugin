import './index.scss';

import { MapsExplorerDashboardsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new MapsExplorerDashboardsPlugin();
}
export { MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart } from './types';
