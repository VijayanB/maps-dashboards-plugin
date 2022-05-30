import React from 'react';
import { i18n } from '@osd/i18n';
import { convertToGeoJson } from '../../../src/plugins/maps_legacy/public';
import { truncatedColorSchemas } from '../../../src/plugins/charts/public';
import { createTileMapVisualization } from '../../../src/plugins/tile_map/public';

export const createMapsExplorerDashboardsVisTypeDefinition = (dependencies) => {
  const { uiSettings, regionmapsConfig, getServiceSettings } = dependencies;
  const CoordinateMapsVisualization = createTileMapVisualization(dependencies);

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
        legendPosition: 'bottomright',
        addTooltip: true,
        colorSchema: 'Yellow to Red',
        emsHotLink: '',
        isDisplayWarning: true,
        wms: 'DDG',
        mapZoom: 2,
        mapCenter: [0, 0],
        outlineWeight: 1,
        showAllShapes: true, //still under consideration
      }
    },
    visualization: CoordinateMapsVisualization,
    responseHandler: convertToGeoJson,
    editorConfig: {
      optionsTemplate: (props) => (
        null
      ),
      collections: {
        colorSchemas: truncatedColorSchemas,
        vectorLayers: [],
        tmsLayers: [],
      },
    },
    setup: async (vis) => {
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
