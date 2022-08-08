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
import { getFormatService, getIndexPatternsService, getQueryService } from '../maps_explorer_dashboards_services';
import { lazyLoadMapsExplorerDashboardsModules } from '../lazy_load_bundle';
import { DEFAULT_MAP_EXPLORER_VIS_PARAMS, LayerTypes } from '../common/types/layer';
import { mapTooltipProvider, geoContains } from '../../public';
import { tooltipFormatter } from '../../public/tooltip_formatter'
import { getPrecision, getZoomPrecision } from './precision'

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
      this._mapIsLoaded = this._makeOpenSearchDashboardsMap();
      this._tooltipFormatter = mapTooltipProvider(element, tooltipFormatter);
      // layer id : openSearchDashboards map layer
      this._layers = {}
      // layer id : opensearchResponse
      this._opensearchResponses = {}
      this._prepareGeohashLayer();
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

    /**
     * Implementation of Visualization#render.
     * Child-classes can extend this method if the render-complete function requires more time until rendering has completed.
     * @param opensearchResponse
     * @param status
     * @return {Promise}
     */
    async render(opensearchResponse, visParams) {
      // console.log("this.vis", this.vis);
      // console.log("visParam", visParams);
      // console.log("opensearchResponse", opensearchResponse);

      if (!this._opensearchDashboardsMap) {
        //the visualization has been destroyed;
        return;
      }

      await this._mapIsLoaded;
      this._opensearchDashboardsMap.resize();
      this._params = visParams;
      await this._updateParams();

      this._opensearchDashboardsMap.useUiStateFromVisualization(this.vis);

      this._geohashUpdateBound = false;
      await this._updateLayers(opensearchResponse);
      await this._triggerNextLayerRender(visParams.renderLayerIdx);
    }

    /**
     * Trigger the layer render starting from the given renderLayerIdx.
     * If renderlayerIndex is not provided, it will start from the first layer if available.
     * @param {*} renderLayerIdx 
     * @returns 
     */
    async _triggerNextLayerRender(renderLayerIdx) {
      const { layerIdOrder, layersOptions } = this._getMapsParams();
      if (layerIdOrder.length === 0 || renderLayerIdx + 1 === layerIdOrder.length) {
        return;
      }

      const updateVarsObject = {
        name: 'renderLayer',
        data: {
          indexPatternService: getIndexPatternsService()
        },
      };

      if (renderLayerIdx === undefined) {
        // if render layer idx is not specified, it will try to render from the first layer
        updateVarsObject.data = {
          ...updateVarsObject.data,
          renderLayerIdx: 0,
        }
      } else {
        // render next layer if available
        updateVarsObject.data = {
          ...updateVarsObject.data,
          renderLayerIdx: renderLayerIdx + 1,
        }
      }

      // Add geohash boundingBox and precision
      const layerId = layerIdOrder[updateVarsObject.data.renderLayerIdx];
      console.log("trigger id", updateVarsObject.data.renderLayerIdx, layerId);
      if (LayerTypes.GeohashLayer === layersOptions[layerId].layerType) {
        const geohashAgg = this._getGeoHashAgg(layerId);
        const bounds = this._opensearchDashboardsMap.getBounds();
        const mapCollar = scaleBounds(bounds);
        if (geohashAgg && geoContains(geohashAgg.aggConfigParams.boundingBox, mapCollar)) {
          updateVarsObject.data.boundingBox = geohashAgg.aggConfigParams.boundingBox;
        } else {
          updateVarsObject.data.boundingBox = {
            top_left: mapCollar.top_left,
            bottom_right: mapCollar.bottom_right,
          };
        }
        // todo: autoPrecision should be vis parameter, not aggConfig one
        const zoomPrecision = getZoomPrecision(); 
        updateVarsObject.data.precision = geohashAgg?.aggConfigParams.autoPrecision || geohashAgg?.aggConfigParams.precision === undefined
          ? zoomPrecision[this.vis.getUiState().get('mapZoom')]
          : getPrecision(geohashAgg.aggConfigParams.precision);
      }

      this.vis.eventsSubject.next(updateVarsObject);
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
      const { layersOptions, layerIdOrder, renderLayerIdx } = this._getMapsParams();
      if (renderLayerIdx === undefined) {
        return;
      }

      // remove the deleted and hidden layers 
      for (let layerId in this._layers) {
        if (layerIdOrder.find((id) => { return id === layerId }) === undefined || this._shouldHideLayer(layersOptions[layerId])) {
          this._opensearchDashboardsMap.removeLayer(this._layers[layerId]);
          delete this._layers[layerId];
        }
      }

      const id = layerIdOrder[renderLayerIdx];
      console.log("visualiztion id", renderLayerIdx, id);
      let layerOptions = layersOptions[id];
      if (this._shouldHideLayer(layerOptions)) {
        return;
      }
      if (!this._layers[id]) {
        let newLayer = null;
        switch (layerOptions.layerType) {
          case LayerTypes.TMSLayer: newLayer = await this._createTmsLayer(layerOptions); break;
          case LayerTypes.WMSLayer: newLayer = await this._createWmsLayer(layerOptions); break;
          case LayerTypes.GeohashLayer:
            this._opensearchResponses[id] = opensearchResponse;
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
            await newLayer.update(this.convertGeohashOptions(layerOptions), this._opensearchResponses[id]).then(() => {
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
        switch (layerOptions.layerType) {
          case LayerTypes.GeohashLayer: this._opensearchResponses[id] = opensearchResponse; break;
        }
        if (layerOptions.layerType === LayerTypes.GeohashLayer) {
          await this._layers[id].update(this.convertGeohashOptions(layerOptions), this._opensearchResponses[id]);
        } else {
          await this._layers[id].update(layerOptions, undefined);
        }
      }
      this._layers[id].bringToFront();
    }

    _shouldHideLayer(layerOptions) {
      return layerOptions.isHidden === true
        || this._opensearchDashboardsMap.getZoomLevel() < layerOptions.minZoom
        || this._opensearchDashboardsMap.getZoomLevel() > layerOptions.maxZoom;
    }

    async _prepareGeohashLayer() {
      await this._mapIsLoaded;
      let previousGeohashPrecision = this._opensearchDashboardsMap.getGeohashPrecision();
      let precisionGeohashChange = false;

      this._opensearchDashboardsMap.on('zoomchange', () => {
        precisionGeohashChange = previousGeohashPrecision !== this._opensearchDashboardsMap.getGeohashPrecision();
        previousGeohashPrecision = this._opensearchDashboardsMap.getGeohashPrecision();
      });

      this._opensearchDashboardsMap.on('zoomend', () => {
        for (const idx in this._getMapsParams().layerIdOrder) {
          const layerId = this._getMapsParams().layerIdOrder[idx];
          const geohashAgg = this._getGeoHashAgg(layerId);
          if (!geohashAgg) {
            continue;
          }
          const isAutoPrecision =
            typeof geohashAgg.aggConfigParams.autoPrecision === 'boolean'
              ? geohashAgg.aggConfigParams.autoPrecision
              : true;
          if (!isAutoPrecision) {
            continue;
          }
        }
        // re-render starting from the first layer.
        this._triggerNextLayerRender();
      });

      this._opensearchDashboardsMap.on('drawCreated:rectangle', (event) => {
        this._addSpatialFilters('geo_bounding_box', event.bounds);
      });

      this._opensearchDashboardsMap.on('drawCreated:polygon', (event) => {
        this._addSpatialFilters('geo_polygon', { points: event.points });
      });
    }

    _addSpatialFilters(filterName, filterData) {
      let filters = [];
      for (const idx in this._getMapsParams().layerIdOrder) {
        const layerId = this._getMapsParams().layerIdOrder[idx];
        const geohashAgg = this._getGeoHashAgg(layerId);
        if (!geohashAgg) {
          continue;
        }
        filters = [...filters, this._createSpatialFilter(geohashAgg, filterName, filterData)];
      }
      const { filterManager } = getQueryService();
      filterManager.addFilters(filters);
      this.vis.updateState();
    }

    _createSpatialFilter(agg, filterName, filterData) {
      if (!agg) {
        return;
      }

      const field = agg.aggConfigParams.field;
      const filter = { meta: { negate: false } };
      filter[filterName] = { ignore_unmapped: true };
      filter[filterName][field] = filterData;

      return filter;
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
        valueFormatter: this._opensearchResponses[newOptions.id]
          ? metricFormat.getConverterFor('text')
          : null,
        tooltipFormatter: this._opensearchResponses[newOptions.id]
          ? this._tooltipFormatter.bind(null, metricLabel, metricFormat.getConverterFor('text'))
          : null,
        isFilteredByCollar: this._isFilteredByCollar(newOptions.id),
      };
    }

    async _createGeohashLayer(newOptions) {
      const { GeohashLayer } = await import('./layer/geohash_layer/geohash_layer');

      this._geohashLayer = new GeohashLayer(
        this._opensearchResponses[newOptions.id],
        newOptions,
        this._opensearchDashboardsMap,
        (await lazyLoadMapsExplorerDashboardsModules()).L
      );
      return this._geohashLayer;
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

    _getGeoHashAgg(layerId) {
      return (
        this._opensearchResponses[layerId] && this._opensearchResponses[layerId].meta.geohash
      );
    }

    _isFilteredByCollar(layerId) {
      const DEFAULT = false;
      const agg = this._getGeoHashAgg(layerId);
      if (agg) {
        return get(agg, 'aggConfigParams.isFilteredByCollar', DEFAULT);
      } else {
        return DEFAULT;
      }
    }
  };
}
