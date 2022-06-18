/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Options which each layer included
 * Each layers hava options: id, name and layerTypes
 */
export interface LayerOptions {
  id: string; // the unique id for the layer instance
  name: string;
  layerType: LayerTypes;
}

/**
 * LayerTypes which users can choose for every layer
 */
export enum LayerTypes {
  TMSLayer = "tms_layer",
  GeohashLayer = "geohash_layer",
}
