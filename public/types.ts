import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface MapsExplorerDashboardsPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapsExplorerDashboardsPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
