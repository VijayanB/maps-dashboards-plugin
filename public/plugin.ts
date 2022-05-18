import { i18n } from '@osd/i18n';
import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  MapsExplorerDashboardsPluginSetup,
  MapsExplorerDashboardsPluginStart,
  MapsExplorerDashboardsPluginSetupDependencies,
  createMapsExplorerDashboardsVisTypeDefinition,
} from './types';
import { PLUGIN_NAME } from '../common';

export class MapsExplorerDashboardsPlugin
  implements Plugin<MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart> {
  public setup(
      core: CoreSetup,
      { expressions, visualizations }: MapsExplorerDashboardsPluginSetupDependencies
    ) {

    visualizations.createBaseVisualization(
      createMapsExplorerDashboardsVisTypeDefinition()
    );

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('mapsExplorerDashboards.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): MapsExplorerDashboardsPluginStart {
    return {};
  }

  public stop() {}
}
