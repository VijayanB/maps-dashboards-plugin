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

import { EventEmitter } from 'events';

export class OpenSearchDashboardsMapLayer extends EventEmitter {

  _leafletLayer: any;
  _attribution: any;
  
  constructor() {
    super();
    this._leafletLayer = null;
  }

  async getBounds() {
    return this._leafletLayer.getBounds();
  }

  addToLeafletMap(leafletMap: any) {
    this._leafletLayer.addTo(leafletMap);
  }

  removeFromLeafletMap(leafletMap: any) {
    leafletMap.removeLayer(this._leafletLayer);
  }

  appendLegendContents() {}

  updateExtent() {}

  movePointer() {}

  getAttributions() {
    return this._attribution;
  }

  /**
   * Update the layer's desaturated status
   * @param isDesaturated 
   * @returns 
   */
  setDesaturate(isDesaturated: boolean) {}
}