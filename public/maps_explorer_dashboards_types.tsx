import React from 'react';
import { i18n } from '@osd/i18n';
import { convertToGeoJson } from '.';
import { truncatedColorSchemas } from '../../../src/plugins/charts/public';
import { Vis } from '../../../src/plugins/visualizations/public';
import { MapsExplorerDashboardsVisualizationDependencies } from './plugin';
import { createVisualization } from './maps_explorer_dashboards_visualization';

export const createMapsExplorerDashboardsVisTypeDefinition = (dependencies: MapsExplorerDashboardsVisualizationDependencies) => {
  const { uiSettings, getServiceSettings } = dependencies;
  const visualization = createVisualization(dependencies);

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
        colorSchema: 'Yellow to Red',
        mapType: 'Scaled Circle Markers',
        isDesaturated: true,
        addTooltip: true,
        heatClusterSize: 1.5,
        legendPosition: 'bottomright',
        mapZoom: 2,
        mapCenter: [0, 0],
        wms: uiSettings.get('visualization:tileMap:WMSdefaults'),
      }
    },
    visualization,
    responseHandler: convertToGeoJson,
    editorConfig: {
      hideSidebar: true,
      optionsTemplate: () => (
        null
      ),
      collections: {
        colorSchemas: truncatedColorSchemas,
        vectorLayers: [],
        tmsLayers: [],
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
