import './index.scss';

import { MapsDashboardsPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new MapsDashboardsPluginPlugin();
}
export { MapsDashboardsPluginPluginSetup, MapsDashboardsPluginPluginStart } from './types';
