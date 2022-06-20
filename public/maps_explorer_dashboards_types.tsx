import { i18n } from '@osd/i18n';
import { convertToGeoJson } from '.';
import { truncatedColorSchemas } from '../../../src/plugins/charts/public';
import { Vis } from '../../../src/plugins/visualizations/public';
import { MapsExplorerDashboardsVisualizationDependencies } from './plugin';
import { LayerTypes } from './common/types';
import { MapsExplorerEditorController } from './components/maps_explorer_editor_controller';

export const createMapsExplorerDashboardsVisTypeDefinition = (dependencies: MapsExplorerDashboardsVisualizationDependencies) => {
  const { uiSettings, getServiceSettings } = dependencies;

  return {
    name: 'maps_explorer_dashboards',
    // TODO: Define String ID  'visTypeMetric.mapsExplorerDashboardsTitle'
    title: i18n.translate('visTypeMetric.mapsExplorerDashboardsTitle', { defaultMessage: 'Maps Explorer' }),
    // TODO: change to the unique icon later
    icon: 'visMapRegion',
    // TODO: Define String ID 'visTypeMetric.metricDescription'
    description: i18n.translate('visTypeMetric.metricDescription', {
      defaultMessage: 'Add/Remove specific map layers depending on demand.',
    }),
    visConfig: {
      defaults: {
        layersOptions: {},
        layerIdOrder: []
      }
    },
    visualization: dependencies.BaseMapsVisualization,
    responseHandler: convertToGeoJson,
    editor: MapsExplorerEditorController,
    editorConfig: {
      collections: {
        colorSchemas: truncatedColorSchemas,
        layerTypes: [
          {
            value: LayerTypes.TMSLayer,
            text: i18n.translate('mapsExplorer.vis.editorConfig.layerTypes.tmsLayerText', {
              defaultMessage: 'TMS Layer',
            }),
          },
          {
            value: LayerTypes.GeohashLayer,
            text: i18n.translate('mapsExplorer.vis.editorConfig.layerTypes.geohashLayerText', {
              defaultMessage: 'Geohash Layer',
            }),
          },
        ],
      },
    },
    setup: async (vis: Vis) => {
      let tmsLayers;

      try {
        const serviceSettings = await getServiceSettings();
        tmsLayers = await serviceSettings.getTMSServices();
      } catch (e) {
        return vis;
      }

      vis.type.editorConfig.collections.tmsLayers = tmsLayers;
      if (!vis.params.wms.selectedTmsLayer && tmsLayers.length) {
        vis.params.wms.selectedTmsLayer = tmsLayers[0];
      }
      return vis;
    },
  }
};
