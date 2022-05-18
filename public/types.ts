import { i18n } from '@osd/i18n';
import { toExpressionAst } from './to_ast';
import { ExpressionFunctionDefinition, ExpressionsPublicPlugin, Render } from '../../../src/plugins/expressions/public';
import { BaseVisTypeOptions, VisualizationsSetup } from '../../../src/plugins/visualizations/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface MapsExplorerDashboardsPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapsExplorerDashboardsPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export interface MapsExplorerDashboardsPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
}

export interface MapsExplorerDashboardsRenderValue {
  visType: 'maps_explorer_dashboard';
  visParams: any;
}

interface Arguments {
  expression: string;
  interval: string;
}

export type MapsExplorerDashboardsExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'maps_explorer_dashboards_vis',
  unknown,
  Arguments,
  Render<MapsExplorerDashboardsRenderValue>
>;

export const createMapsExplorerDashboardsVisTypeDefinition = (): BaseVisTypeOptions => ({
  name: 'maps_explorer_dashboards',
  // TODO: Define String ID  'visTypeMetric.mapsExplorerDashboardsTitle'
  title: i18n.translate('visTypeMetric.mapsExplorerDashboardsTitle', { defaultMessage: 'Maps Explorer' }),
  // TODO: change to the unique icon later
  icon: 'visMapRegion',
  // TODO: Define String ID 'visTypeMetric.metricDescription'
  description: i18n.translate('visTypeMetric.metricDescription', {
    defaultMessage: 'Add/Remove specific map layers depending on demand.',
  }),
  visConfig: {},
  editorConfig: {},
  toExpressionAst,
});
