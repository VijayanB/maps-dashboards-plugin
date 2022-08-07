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

import { i18n } from '@osd/i18n';
import { get, round } from 'lodash';
import { getFormatService, getQueryService } from '../maps_explorer_dashboards_services';
import { lazyLoadMapsExplorerDashboardsModules } from '../lazy_load_bundle';
import { DEFAULT_MAP_EXPLORER_VIS_PARAMS, LayerTypes } from '../common/types/layer';
import { getPrecision, mapTooltipProvider, geoContains } from '../../public';
import { tooltipFormatter } from '../../public/tooltip_formatter'
import { getZoomPrecision } from './precision'

const DEFAULT_MINZOOM = 0;
const DEFAULT_MAXZOOM = 22; //increase this to 22. Better for WMS

function scaleBounds(bounds) {
  const scale = 0.5; // scale bounds by 50%

  const topLeft = bounds.top_left;
  const bottomRight = bounds.bottom_right;
  let latDiff = round(Math.abs(topLeft.lat - bottomRight.lat), 5);
  const lonDiff = round(Math.abs(bottomRight.lon - topLeft.lon), 5);
  // map height can be zero when vis is first created
  if (latDiff === 0) latDiff = lonDiff;

  const latDelta = latDiff * scale;
  let topLeftLat = round(topLeft.lat, 5) + latDelta;
  if (topLeftLat > 90) topLeftLat = 90;
  let bottomRightLat = round(bottomRight.lat, 5) - latDelta;
  if (bottomRightLat < -90) bottomRightLat = -90;
  const lonDelta = lonDiff * scale;
  let topLeftLon = round(topLeft.lon, 5) - lonDelta;
  if (topLeftLon < -180) topLeftLon = -180;
  let bottomRightLon = round(bottomRight.lon, 5) + lonDelta;
  if (bottomRightLon > 180) bottomRightLon = 180;

  return {
    top_left: { lat: topLeftLat, lon: topLeftLon },
    bottom_right: { lat: bottomRightLat, lon: bottomRightLon },
  };
}

export function BaseMapsVisualizationProvider() {


  /**
   * Abstract base class for a visualization consisting of a map with a openSearchDashboardsMapLayer.
   * @class BaseMapsVisualization
   * @constructor
   */
  return class BaseMapsVisualization {
    constructor(element, vis) {
      this.vis = vis;
      this._container = element;
      this._opensearchDashboardsMap = null;
      this._chartData = null; //reference to data currently on the map.
      this._mapIsLoaded = this._makeOpenSearchDashboardsMap();
      this._tooltipFormatter = mapTooltipProvider(element, tooltipFormatter);
      // layer id : openSearchDashboards map layer
      this._layers = {}
    }

    isLoaded() {
      return this._mapIsLoaded;
    }

    destroy() {
      if (this._opensearchDashboardsMap) {
        this._opensearchDashboardsMap.destroy();
        this._opensearchDashboardsMap = null;
      }
    }

    updateGeohashAgg = () => {
      const geohashAgg = this._getGeoHashAgg();
      if (!geohashAgg) return;
      const updateVarsObject = {
        name: 'bounds',
        data: {},
      };
      const bounds = this._opensearchDashboardsMap.getBounds();
      const mapCollar = scaleBounds(bounds);
      if (!geoContains(geohashAgg.aggConfigParams.boundingBox, mapCollar)) {
        updateVarsObject.data.boundingBox = {
          top_left: mapCollar.top_left,
          bottom_right: mapCollar.bottom_right,
        };
      } else {
        updateVarsObject.data.boundingBox = geohashAgg.aggConfigParams.boundingBox;
      }
      // todo: autoPrecision should be vis parameter, not aggConfig one
      const zoomPrecision = getZoomPrecision();
      updateVarsObject.data.precision = geohashAgg.aggConfigParams.autoPrecision
        ? zoomPrecision[this.vis.getUiState().get('mapZoom')]
        : getPrecision(geohashAgg.aggConfigParams.precision);

        console.log("this.vis.eventsSubject.next", updateVarsObject)
      this.vis.eventsSubject.next(updateVarsObject);
    };
    /**
     * Implementation of Visualization#render.
     * Child-classes can extend this method if the render-complete function requires more time until rendering has completed.
     * @param opensearchResponse
     * @param status
     * @return {Promise}
     */
    async render(opensearchResponse, visParams) {
      console.log("RENDER");
      console.log("opensearchResponse ", opensearchResponse);
      console.log("visParams ", visParams);

      if (!this._opensearchDashboardsMap) {
        //the visualization has been destroyed;
        return;
      }

      await this._mapIsLoaded;
      this._opensearchDashboardsMap.resize();
      this._params = visParams;
      await this._updateParams();

      this._opensearchDashboardsMap.useUiStateFromVisualization(this.vis);
      await this._updateLayers(opensearchResponse);
    }

    /**
     * Creates an instance of a opensearch-dashboards-map with a openSearchDashboardsMapLayer and assigns it to the this._opensearchDashboardsMap property.
     * Clients can override this method to customize the initialization.
     * @private
     */
    async _makeOpenSearchDashboardsMap() {
      const options = {};
      const uiState = this.vis.getUiState();
      const zoomFromUiState = parseInt(uiState.get('mapZoom'));
      const centerFromUIState = uiState.get('mapCenter');
      options.zoom = !isNaN(zoomFromUiState) ? zoomFromUiState : this.vis.params.mapZoom;
      options.center = centerFromUIState ? centerFromUIState : this.vis.params.mapCenter;

      const modules = await lazyLoadMapsExplorerDashboardsModules();
      this.L = modules.L;
      this._opensearchDashboardsMap = new modules.OpenSearchDashboardsMap(this._container, options);
      this._opensearchDashboardsMap.setMinZoom(DEFAULT_MINZOOM); //use a default
      this._opensearchDashboardsMap.setMaxZoom(DEFAULT_MAXZOOM); //use a default

      this._opensearchDashboardsMap.addLegendControl();
      this._opensearchDashboardsMap.addFitControl();
      this._opensearchDashboardsMap.addDrawControl();
      this._opensearchDashboardsMap.persistUiStateForVisualization(this.vis);
      await this._updateLayers(undefined);
    }

    /**
     * Update layers with new params
     */
    async _updateLayers(opensearchResponse) {
      const { layersOptions, layerIdOrder } = this._getMapsParams();
      // remove the deleted and hidden layers 
      for (let layerId in this._layers) {
        if (layerIdOrder.find((id) => { return id === layerId }) === undefined || this._shouldHideLayer(layersOptions[layerId])) {
          this._opensearchDashboardsMap.removeLayer(this._layers[layerId]);
          delete this._layers[layerId];
        }
      }

      for (const id of layerIdOrder) {
        let layerOptions = layersOptions[id];
        if (this._shouldHideLayer(layerOptions)) {
          continue;
        }
        if (!this._layers[id]) {
          let newLayer = null;
          switch (layerOptions.layerType) {
            case LayerTypes.TMSLayer: newLayer = await this._createTmsLayer(layerOptions); break;
            case LayerTypes.WMSLayer: newLayer = await this._createWmsLayer(layerOptions); break;
            case LayerTypes.GeohashLayer:
              this.prepareGeohashLayer();
              this._updateGeohashData(opensearchResponse);
              newLayer = await this._createGeohashLayer(this.convertGeohashOptions(layerOptions)); break;
            default:
              throw new Error(
                i18n.translate('mapExplorerDashboard.layerType.unsupportedErrorMessage', {
                  defaultMessage: '{layerType} layer type not recognized',
                  values: {
                    layerType: layerOptions.layerType,
                  },
                })
              );
          }
          if (newLayer) {
            if (LayerTypes.GeohashLayer === layerOptions.layerType) {
              await newLayer.update(this.convertGeohashOptions(layerOptions), this._geoJsonFeatureCollectionAndMeta).then(() => {
                this._opensearchDashboardsMap.addLayer(newLayer);
                this._layers[id] = newLayer;
              });
            } else {
              await newLayer.update(layerOptions, undefined).then(() => {
                this._opensearchDashboardsMap.addLayer(newLayer);
                this._layers[id] = newLayer;
              });
            }
          }
        } else {
          if (this._hasOpenSearchResponseChanged(opensearchResponse)) {
            switch (layerOptions.layerType) {
              case LayerTypes.GeohashLayer: await this._updateGeohashData(opensearchResponse); break;
            }
          }
          if (layerOptions.layerType === LayerTypes.GeohashLayer) {
            await this._layers[id].update(this.convertGeohashOptions(layerOptions), this._geoJsonFeatureCollectionAndMeta);
          } else {
            await this._layers[id].update(layerOptions, undefined);
          }
        }
        this._layers[id].bringToFront();
      }
    }

    _shouldHideLayer(layerOptions) {
      return layerOptions.isHidden === true
        || this._opensearchDashboardsMap.getZoomLevel() < layerOptions.minZoom
        || this._opensearchDashboardsMap.getZoomLevel() > layerOptions.maxZoom;
    }

    async prepareGeohashLayer() {
      let previousGeohashPrecision = this._opensearchDashboardsMap.getGeohashPrecision();
      let precisionGeohashChange = false;

      const uiState = this.vis.getUiState();
      uiState.on('change', (prop) => {
        if (prop === 'mapZoom' || prop === 'mapCenter') {
          this.updateGeohashAgg();
        }
      });

      this._opensearchDashboardsMap.on('zoomchange', () => {
        precisionGeohashChange = previousGeohashPrecision !== this._opensearchDashboardsMap.getGeohashPrecision();
        previousGeohashPrecision = this._opensearchDashboardsMap.getGeohashPrecision();
      });
      this._opensearchDashboardsMap.on('zoomend', () => {
        const geohashAgg = this._getGeoHashAgg();
        if (!geohashAgg) {
          return;
        }
        const isAutoPrecision =
          typeof geohashAgg.aggConfigParams.autoPrecision === 'boolean'
            ? geohashAgg.aggConfigParams.autoPrecision
            : true;
        if (!isAutoPrecision) {
          return;
        }
        if (precisionGeohashChange) {
          this.updateGeohashAgg();
        } else {
          //when we filter queries by collar
          this._updateGeohashData(this._geoJsonFeatureCollectionAndMeta);
        }
      });

      this._opensearchDashboardsMap.on('drawCreated:rectangle', (event) => {
        const geohashAgg = this._getGeoHashAgg();
        this.addSpatialFilter(geohashAgg, 'geo_bounding_box', event.bounds);
      });
      this._opensearchDashboardsMap.on('drawCreated:polygon', (event) => {
        const geohashAgg = this._getGeoHashAgg();
        this.addSpatialFilter(geohashAgg, 'geo_polygon', { points: event.points });
      });
    }

    addSpatialFilter(agg, filterName, filterData) {
      if (!agg) {
        return;
      }

      const indexPatternName = agg.indexPatternId;
      const field = agg.aggConfigParams.field;
      const filter = { meta: { negate: false, index: indexPatternName } };
      filter[filterName] = { ignore_unmapped: true };
      filter[filterName][field] = filterData;

      const { filterManager } = getQueryService();
      filterManager.addFilters([filter]);

      this.vis.updateState();
    }


    // @param opensearchResponse
    async _updateGeohashData(geojsonFeatureCollectionAndMeta) {
      // Only recreate geohash layer when there is new aggregation data
      // Exception is Heatmap: which needs to be redrawn every zoom level because the clustering is based on meters per pixel
      if (
        this._getMapsParams().geohashMarkerTypes !== 'Heatmap' &&
        geojsonFeatureCollectionAndMeta === this._geoJsonFeatureCollectionAndMeta
      ) {
        return;
      }

      this._geoJsonFeatureCollectionAndMeta = geojsonFeatureCollectionAndMeta;
      this.updateGeohashAgg();
    }

    async _createTmsLayer(newOptions) {
      const { TMSLayer } = await import('./layer/tms_layer/tms_layer');
      const tmsLayer = new TMSLayer(newOptions, this._opensearchDashboardsMap, this.L);
      return tmsLayer;
    }

    async _createWmsLayer(newOptions) {
      const { WMSLayer } = await import('./layer/wms_layer/wms_layer');
      const wmsLayer = new WMSLayer(newOptions, this._opensearchDashboardsMap, this.L);
      return wmsLayer;
    }

    convertGeohashOptions(newOptions) {
      const newParams = this._getMapsParams();
      const metricDimension = this._params.dimensions.metric;
      const metricLabel = metricDimension ? metricDimension.label : '';
      const metricFormat = getFormatService().deserialize(
        metricDimension && metricDimension.format
      );

      return {
        ...newOptions,
        label: metricLabel,
        valueFormatter: this._geoJsonFeatureCollectionAndMeta
          ? metricFormat.getConverterFor('text')
          : null,
        tooltipFormatter: this._geoJsonFeatureCollectionAndMeta
          ? this._tooltipFormatter.bind(null, metricLabel, metricFormat.getConverterFor('text'))
          : null,
        isFilteredByCollar: this._isFilteredByCollar(),
      };
    }

    async _createGeohashLayer(newOptions) {
      const { GeohashLayer } = await import('./layer/geohash_layer/geohash_layer');

      this._geohashLayer = new GeohashLayer(
        this._geoJsonFeatureCollectionAndMeta,
        newOptions,
        this._opensearchDashboardsMap,
        (await lazyLoadMapsExplorerDashboardsModules()).L
      );
      return this._geohashLayer;
    }


    _hasOpenSearchResponseChanged(data) {
      return this._chartData !== data;
    }

    /**
     * called on options change (vis.params change)
     */
    async _updateParams() {
      const mapParams = this._getMapsParams();
      // this._opensearchDashboardsMap.setLegendPosition(mapParams.legendPosition);
      this._opensearchDashboardsMap.setShowTooltip(mapParams.addTooltip);
      this._opensearchDashboardsMap.useUiStateFromVisualization(this.vis);
    }

    _getMapsParams() {
      return {
        ...DEFAULT_MAP_EXPLORER_VIS_PARAMS,
        type: this.vis.type.name,
        ...this._params,
      };
    }

    _getGeoHashAgg() {
      return (
        this._geoJsonFeatureCollectionAndMeta && this._geoJsonFeatureCollectionAndMeta.meta.geohash
      );
    }

    _isFilteredByCollar() {
      const DEFAULT = false;
      const agg = this._getGeoHashAgg();
      if (agg) {
        return get(agg, 'aggConfigParams.isFilteredByCollar', DEFAULT);
      } else {
        return DEFAULT;
      }
    }
  };
}
