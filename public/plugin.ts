import { i18n } from '@osd/i18n';
import { CoreSetup, CoreStart, IUiSettingsClient, Plugin, PluginInitializerContext } from 'src/core/public';
import {
  MapsExplorerDashboardsPluginSetup,
  MapsExplorerDashboardsPluginStart,
  MapsExplorerDashboardsPluginSetupDependencies,
  createMapsExplorerDashboardsVisTypeDefinition,
} from './types';
import { PLUGIN_NAME } from '../common';
// @ts-ignore
import { createMapsExplorerDashboardsFn } from './maps_explorer_dashboards_fn';
// @ts-ignore
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { ExpressionFunctionDefinition, Render } from 'src/plugins/expressions';
import { ExpressionsPublicPlugin } from 'src/plugins/expressions/public';
import { VisualizationsSetup } from 'src/plugins/visualizations/public';
import { IServiceSettings, MapsLegacyPluginSetup } from 'src/plugins/maps_legacy/public';
import { MapsLegacyConfig } from 'src/plugins/maps_legacy/config';

export interface MapsExplorerDashboardsPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapsExplorerDashboardsPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

/** @private */
interface RegionMapVisualizationDependencies {
  uiSettings: IUiSettingsClient;
  getServiceSettings: () => Promise<IServiceSettings>;
  BaseMapsVisualization: any;
}

export interface MapsExplorerDashboardsPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
  mapsLegacy: MapsLegacyPluginSetup;
}

export interface MapsExplorerDashboardsRenderValue {
  visType: 'maps_explorer_dashboards';
  visParams: any;
}

interface Arguments {
  expression: string;
  interval: string;
}

export type MapsExplorerDashboardsExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'maps_explorer_dashboards',
  unknown,
  Arguments,
  Render<MapsExplorerDashboardsRenderValue>
>;

export class MapsExplorerDashboardsPlugin
  implements Plugin<MapsExplorerDashboardsPluginSetup, MapsExplorerDashboardsPluginStart> {
  readonly _initializerContext: PluginInitializerContext<MapsLegacyConfig>;

  constructor(initializerContext: PluginInitializerContext) {
    this._initializerContext = initializerContext;
  }
  
  public setup(
    core: CoreSetup,
    { expressions, visualizations, mapsLegacy }: MapsExplorerDashboardsPluginSetupDependencies
  ) {

    const visualizationDependencies: Readonly<RegionMapVisualizationDependencies> = {
      uiSettings: core.uiSettings,
      getServiceSettings: mapsLegacy.getServiceSettings,
      BaseMapsVisualization: mapsLegacy.getBaseMapsVis(),
    };
  
    expressions.registerFunction(createMapsExplorerDashboardsFn);

    visualizations.createBaseVisualization(
      createMapsExplorerDashboardsVisTypeDefinition(visualizationDependencies)
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

  public stop() { }
}
