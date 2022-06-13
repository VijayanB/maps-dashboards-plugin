/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { OpenSearchDashboardsMapLayer } from "../../..";
import {
    createRegionBlockedWarning,
    removeRegionBlockedWarning
} from '../../map_messages';
import { ORIGIN } from '../../../common/constants/origin';

/**
 * Construct TmsLayer
 */
export class TmsLayer extends OpenSearchDashboardsMapLayer {
    _options;
    _opensearchDashboardsMap;
    _leaflet;
    _isDesaturated;

    constructor(
        options: any,
        opensearchDashboardsMap: any,
        leaflet: any
    ) {
        super();
        this._options = options;
        this._opensearchDashboardsMap = opensearchDashboardsMap;
        this._leaflet = leaflet;
        this._isDesaturated = true;
        this._leafletLayer = this._createTmsLeafletLayer();
    }

    /**
     * Create a new tmsLayer
     * @returns leafletLayer
     */
    _createTmsLeafletLayer() {
        let leafletLayer = this._leaflet.tileLayer(this._options.url, {
            minZoom: this._options.minZoom,
            maxZoom: this._options.maxZoom,
            subdomains: this._options.subdomains || [],
        });

        if (leafletLayer) {
            leafletLayer.on("tileload", () => this._updateDesaturation());
            leafletLayer.on('tileerror', () => {
                if (this._options.showRegionBlcokedWarning) {
                    createRegionBlockedWarning();
                }
            });

            if (this._options.showZoomMessage) {
                leafletLayer.on('add', () => {
                    this._opensearchDashboardsMap._addMaxZoomMessage(leafletLayer)
                });
            }
        }
        return leafletLayer;
    }

    _updateDesaturation() {
        removeRegionBlockedWarning();
        const tiles = $('img.leaflet-tile-loaded');
        // Don't apply client-side styling to EMS basemaps
        if (this._options.origin === ORIGIN.EMS) {
            tiles.addClass('filters-off');
        } else if (this._isDesaturated) {
            tiles.removeClass('filters-off');
        }
        else if (!this._isDesaturated) {
            tiles.addClass('fileters-off');
        }
    }

    setDesaturate(isDesaturated: boolean) {
        if (isDesaturated === this._isDesaturated) {
            return;
        }
        this._isDesaturated = isDesaturated;
        this._updateDesaturation();
        if (this._leafletLayer) {
            this._leafletLayer.redraw();
        }
    }

}
