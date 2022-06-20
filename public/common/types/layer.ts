/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';

/**
 * Options which each layer included
 * Each layers hava options: id, name and layerTypes
 */
export interface LayerOptions {
  id: string; // the unique id for the layer instance
  name: string;
  layerType?: LayerTypes;
}

/**
 * LayerTypes which users can choose for every layer
 */
export enum LayerTypes {
  TMSLayer = "TMS Layer",
  GeohashLayer = "Geohash Layer",
}

export const DEFAULT_NEW_LAYER_OPTIONS: LayerOptions = {
  id: "new_layer",
  name: i18n.translate('layers.defaultNewLayerOptions.name', { defaultMessage: 'New Layer' }),
} 
