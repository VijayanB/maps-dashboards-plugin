/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { min, isEqual } from 'lodash';
import { i18n } from '@osd/i18n';
import { OpenSearchDashboardsMapLayer } from '../../..';
import { GeohashMarkerTypes } from '../../../components/layer_control/layers_config_options/geohash_configuration_options';
import { HeatmapMarkers } from './markers/heatmap';
import { ScaledCirclesMarkers } from './markers/scaled_circles';
import { ShadedCirclesMarkers } from './markers/shaded_circles';
import { GeohashGridMarkers } from './markers/geohash_grid';

export class GeohashLayer extends OpenSearchDashboardsMapLayer {
  constructor(
    data,
    options,
    opensearchDashboardsMap,
    leaflet
  ) {
    super();

    this._data = data;
    this._options = options;
    this._opensearchDashboardsMap = opensearchDashboardsMap;
    this._leaflet = leaflet;
    const geojson = this._leaflet.geoJson(this._data.featureCollection);
    this._bounds = geojson.getBounds();
    this.createLeafletLayer();
    this._lastBounds = null;
  }

  createLeafletLayer() {
    const markerOptions = {
      isFilteredByCollar: this._options.isFilteredByCollar,
      valueFormatter: this._options.valueFormatter,
      tooltipFormatter: this._options.tooltipFormatter,
      label: this._options.label,
      colorRamp: this._options.typeOptions.colorRamp,
    };

    switch (this._options.typeOptions.geohashMarkerTypes) {
      case GeohashMarkerTypes.ScaledCircleMarkers:
        this._geohashMarkers = new ScaledCirclesMarkers(
          this._data.featureCollection,
          this._data.meta,
          markerOptions,
          this._opensearchDashboardsMap.getZoomLevel(),
          this._opensearchDashboardsMap,
          this._leaflet
        );
        break;
      case GeohashMarkerTypes.ShadedCircleMarkers:
        this._geohashMarkers = new ShadedCirclesMarkers(
          this._data.featureCollection,
          this._data.meta,
          markerOptions,
          this._opensearchDashboardsMap.getZoomLevel(),
          this._opensearchDashboardsMap,
          this._leaflet
        );
        break;
      case GeohashMarkerTypes.ShadedGeohashGrid:
        this._geohashMarkers = new GeohashGridMarkers(
          this._data.featureCollection,
          this._data.meta,
          markerOptions,
          this._opensearchDashboardsMap.getZoomLevel(),
          this._opensearchDashboardsMap,
          this._leaflet
        );
        break;
      case GeohashMarkerTypes.Heatmap:
        let radius = 15;
        if (this._data.meta.geohashGridDimensionsAtEquator) {
          const minGridLength = min(this._data.meta.geohashGridDimensionsAtEquator);
          const metersPerPixel = this._opensearchDashboardsMap.getMetersPerPixel();
          radius = minGridLength / metersPerPixel / 2;
        }
        radius = radius * parseFloat(this._options.typeOptions.heatClusterSize);
        this._geohashMarkers = new HeatmapMarkers(
          this._data.featureCollection,
          {
            radius: radius,
            blur: radius,
            maxZoom: this._opensearchDashboardsMap.getZoomLevel(),
            minOpacity: 0.1,
            tooltipFormatter: this._options.tooltipFormatter,
          },
          this._opensearchDashboardsMap.getZoomLevel(),
          this._data.meta.max,
          this._leaflet
        );
        break;
      default:
        throw new Error(
          i18n.translate('tileMap.geohashLayer.mapTitle', {
            defaultMessage: '{geohashMarkerTypes} geohashMarkerTypes not recognized',
            values: {
              geohashMarkerTypes: this._options.typeOptions.geohashMarkerTypes,
            },
          })
        );
    }

    this._geohashMarkers.on('showTooltip', (event) => this.emit('showTooltip', event));
    this._geohashMarkers.on('hideTooltip', (event) => this.emit('hideTooltip', event));
    return this._geohashMarkers.getLeafletLayer();
  }

  appendLegendContents(jqueryDiv) {
    return this._geohashMarkers.appendLegendContents(jqueryDiv);
  }

  movePointer(...args) {
    this._geohashMarkers.movePointer(...args);
  }

  async getBounds() {
    if (this._options.fetchBounds) {
      const geoHashBounds = await this._options.fetchBounds();
      if (geoHashBounds) {
        const northEast = this._leaflet.latLng(
          geoHashBounds.top_left.lat,
          geoHashBounds.bottom_right.lon
        );
        const southWest = this._leaflet.latLng(
          geoHashBounds.bottom_right.lat,
          geoHashBounds.top_left.lon
        );
        return this._leaflet.latLngBounds(southWest, northEast);
      }
    }

    return this._bounds;
  }

  updateExtent() {
    // Client-side filtering is only enabled when server-side filter is not used
    if (!this._options.isFilteredByCollar) {
      const bounds = this._opensearchDashboardsMap.getLeafletBounds();
      if (!this._lastBounds || !this._lastBounds.equals(bounds)) {
        //this removal is required to trigger the bounds filter again
        this.removeFromLeafletMap(this._opensearchDashboardsMap._leafletMap);
        this._leafletLayer = this.createLeafletLayer();
        this.addToLeafletMap(this._opensearchDashboardsMap._leafletMap);
      }
      this._lastBounds = bounds;
    }
  }

  isReusable(options) {
    if (isEqual(this._options, options)) {
      return true;
    }

    //check if any impacts leaflet styler function
    if (this._options.typeOptions.colorRamp !== options.typeOptions.colorRamp) {
      return false;
    } else if (this._options.typeOptions.geohashMarkerTypes !== options.typeOptions.geohashMarkerTypes) {
      return false;
    } else if (
      this._options.typeOptions.geohashMarkerTypes === 'Heatmap' &&
      !isEqual(this._options.typeOptions.heatClusterSize, options.typeOptions.heatClusterSize)
    ) {
      return false;
    } else {
      return true;
    }
  }
}
