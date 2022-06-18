import React from 'react';
import { i18n } from '@osd/i18n';
import { convertToGeoJson } from '.';
import { truncatedColorSchemas } from '../../../src/plugins/charts/public';
import { Vis } from '../../../src/plugins/visualizations/public';
import { MapsExplorerDashboardsVisualizationDependencies } from './plugin';
import { LayerTypes } from './common/types';
import { MapExplorerOptions, MapsExlorerOptionsProps } from './components/maps_explorer_options';

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
        layersOptions: {
          default_layer: {
            id: "default_layer",
            name: "Default Layer",
            layerType: LayerTypes.TMSLayer,
          }
        },
        curLayerId: "default_layer",
        layerIdOrder: ["default_layer"]
      }
    },
    visualization: dependencies.BaseMapsVisualization,
    responseHandler: convertToGeoJson,
    editorConfig: {
      hideSidebar: false,
      optionsTemplate: (props: MapsExlorerOptionsProps) => <MapExplorerOptions {...props} />,
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
