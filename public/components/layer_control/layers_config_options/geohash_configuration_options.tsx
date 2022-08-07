/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useEffect } from 'react';
import { EuiPanel, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { BasicOptions, RangeOption, SelectOption, SwitchOption, truncatedColorSchemas } from '../../../../../../src/plugins/charts/public';

export enum GeohashMarkerTypes {
  ScaledCircleMarkers = 'Scaled Circle Markers',
  ShadedCircleMarkers = 'Shaded Circle Markers',
  ShadedGeohashGrid = 'Shaded Geohash Grid',
  Heatmap = 'Heatmap',
}

const GEOHASH_MAP_TYPES = [
  {
    value: GeohashMarkerTypes.ScaledCircleMarkers,
    text: i18n.translate('tileMap.vis.editorConfig.geohashMarkerTypes.scaledCircleMarkersText', {
      defaultMessage: 'Scaled circle markers',
    }),
  },
  {
    value: GeohashMarkerTypes.ShadedCircleMarkers,
    text: i18n.translate('tileMap.vis.editorConfig.geohashMarkerTypes.shadedCircleMarkersText', {
      defaultMessage: 'Shaded circle markers',
    }),
  },
  {
    value: GeohashMarkerTypes.ShadedGeohashGrid,
    text: i18n.translate('tileMap.vis.editorConfig.geohashMarkerTypes.shadedGeohashGridText', {
      defaultMessage: 'Shaded geohash grid',
    }),
  },
  {
    value: GeohashMarkerTypes.Heatmap,
    text: i18n.translate('tileMap.vis.editorConfig.geohashMarkerTypes.heatmapText', {
      defaultMessage: 'Heatmap',
    }),
  },
];

const COLOR_RAMP = truncatedColorSchemas;

export interface GEOHashConfigurationOptions {
  colorRamp: string;
  geohashMarkerTypes: GeohashMarkerTypes;
  addTooltip: boolean;
  heatClusterSize: number;
  mapZoom: number;
  mapCenter: [number, number];
}

interface GeohashConfigurationOptionsProps {
  geohashOptions: GEOHashConfigurationOptions;
  setTypeOptions<T extends keyof GEOHashConfigurationOptions>(paramName: T, value: GEOHashConfigurationOptions[T]): void;
  setOptionValidity(isValid: boolean): void
}

function GeohashConfigurationOptions(props: GeohashConfigurationOptionsProps) {
  const { geohashOptions, setTypeOptions, setOptionValidity } = props;

  useEffect(() => {
    if (!geohashOptions.geohashMarkerTypes) {
      setTypeOptions('geohashMarkerTypes', GEOHASH_MAP_TYPES[0].value);
    }
  }, [setTypeOptions, geohashOptions.geohashMarkerTypes, GEOHASH_MAP_TYPES]);

  // Validate user input
  useEffect(() => {
    if (geohashOptions.geohashMarkerTypes && geohashOptions.colorRamp) {
      setOptionValidity(true);
    } else {
      setOptionValidity(false);
    }
  }, [geohashOptions]);

  return (
    <>
      <EuiPanel paddingSize="s">
        <SelectOption
          label={i18n.translate('mapsExplorerDashboards.geohashLayerOptions.geohashMarkerTypesLabel', {
            defaultMessage: 'Map type',
          })}
          options={GEOHASH_MAP_TYPES}
          paramName="geohashMarkerTypes"
          value={geohashOptions.geohashMarkerTypes}
          setValue={setTypeOptions}
        />

        {geohashOptions.geohashMarkerTypes === GeohashMarkerTypes.Heatmap ? (
          <RangeOption
            label={i18n.translate('mapsExplorerDashboards.geohashLayerOptions.clusterSizeLabel', {
              defaultMessage: 'Cluster size',
            })}
            max={3}
            min={1}
            paramName="heatClusterSize"
            step={0.1}
            value={geohashOptions.heatClusterSize}
            setValue={setTypeOptions}
          />
        ) : (
          <SelectOption
            label={i18n.translate('mapsExplorerDashboards.geohashLayerOptions.colorRampLabel', {
              defaultMessage: 'Color schema',
            })}
            options={COLOR_RAMP}
            paramName="colorRamp"
            value={geohashOptions.colorRamp}
            setValue={setTypeOptions}
          />
        )}

      </EuiPanel>
    </>
  );
}

export { GeohashConfigurationOptions };
