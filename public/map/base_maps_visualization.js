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
import { getEmsTileLayerId, getUiSettings, getToasts } from '../maps_explorer_dashboards_services';
import { lazyLoadMapsExplorerDashboardsModules } from '../lazy_load_bundle';
import { getServiceSettings } from '../get_service_settings';

const WMS_MINZOOM = 0;
const WMS_MAXZOOM = 22; //increase this to 22. Better for WMS

export function BaseMapsVisualizationProvider() {
  /**
   * Abstract base class for a visualization consisting of a map with a single TMS Layer.
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
      if (!this._opensearchDashboardsMap) {
        //the visualization has been destroyed;
        return;
      }

      await this._mapIsLoaded;
      this._opensearchDashboardsMap.resize();
      this._params = visParams;
      await this._updateParams();

      if (this._hasOpenSearchResponseChanged(opensearchResponse)) {
        await this._updateData(opensearchResponse);
      }
      this._opensearchDashboardsMap.useUiStateFromVisualization(this.vis);
    }

    /**
     * Creates an instance of a opensearch-dashboards-map with a single TMS layer and assigns it to the this._opensearchDashboardsMap property.
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
      this._opensearchDashboardsMap.setMinZoom(WMS_MINZOOM); //use a default
      this._opensearchDashboardsMap.setMaxZoom(WMS_MAXZOOM); //use a default

      this._opensearchDashboardsMap.addLegendControl();
      this._opensearchDashboardsMap.addFitControl();
      this._opensearchDashboardsMap.addLayerControl();
      this._opensearchDashboardsMap.persistUiStateForVisualization(this.vis);
      await this._makeTmsLayer();
    }

    /**
     * Initialize the map layer
     * @returns 
     */
    async _makeTmsLayer() {
      const emsTileLayerId = getEmsTileLayerId();

      if (!this._opensearchDashboardsMap) {
        return;
      }
      try {
        const serviceSettings = await getServiceSettings();
        const tmsServices = await serviceSettings.getTMSServices();
        const userConfiguredTmsLayer = tmsServices[0];
        const initMapLayer = userConfiguredTmsLayer
          ? userConfiguredTmsLayer
          : tmsServices.find((s) => s.id === emsTileLayerId.bright);
        if (initMapLayer) {
          this._setTmsLayer(initMapLayer);
        }
      } catch (e) {
        getToasts().addWarning(e.message);
        return;
      }
      return;
    }

    /**
     * Create tmsLayer
     * @param {*} tmsLayerOptions 
     */
    async _setTmsLayer(tmsLayerOptions) {
      this._opensearchDashboardsMap.setMinZoom(tmsLayerOptions.minZoom);
      this._opensearchDashboardsMap.setMaxZoom(tmsLayerOptions.maxZoom);
      if (this._opensearchDashboardsMap.getZoomLevel() > tmsLayerOptions.maxZoom) {
        this._opensearchDashboardsMap.setZoomLevel(tmsLayerOptions.maxZoom);
      }
      let isDesaturated = this._getMapsParams().isDesaturated;
      if (typeof isDesaturated !== 'boolean') {
        isDesaturated = true;
      }
      const isDarkMode = getUiSettings().get('theme:darkMode');
      const serviceSettings = await getServiceSettings();
      const meta = await serviceSettings.getAttributesForTMSLayer(
        tmsLayerOptions,
        isDesaturated,
        isDarkMode
      );
      const showZoomMessage = serviceSettings.shouldShowZoomMessage(tmsLayerOptions);
      const options = { ...tmsLayerOptions, showZoomMessage, ...meta };
      // delete options.id;
      delete options.subdomains;
      // create a new TMSLayer and add it to layers
      const { TMSLayer } = await import('./layer/tms_layer/tms_layer');
      const tmsLayer = new TMSLayer(options, this._opensearchDashboardsMap, this.L);
      this._opensearchDashboardsMap.addLayer(tmsLayer);
    }

    async _updateData() {
      throw new Error(
        i18n.translate('maps_legacy.baseMapsVisualization.childShouldImplementMethodErrorMessage', {
          defaultMessage: 'Child should implement this method to respond to data-update',
        })
      );
    }

    _hasOpenSearchResponseChanged(data) {
      return this._chartData !== data;
    }

    /**
     * called on options change (vis.params change)
     */
    async _updateParams() {
      const mapParams = this._getMapsParams();
      this._opensearchDashboardsMap.setLegendPosition(mapParams.legendPosition);
      this._opensearchDashboardsMap.setShowTooltip(mapParams.addTooltip);
      this._opensearchDashboardsMap.useUiStateFromVisualization(this.vis);
    }

    _getMapsParams() {
      return {
        ...this.vis.type.visConfig.defaults,
        type: this.vis.type.name,
        ...this._params,
      };
    }
  };
}
