import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface MapsDashboardsPluginPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapsDashboardsPluginPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
