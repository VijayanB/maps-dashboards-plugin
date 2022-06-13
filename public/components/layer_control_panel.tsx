/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import './layer_control_panel.scss';

interface LayerMetadata {
  id: string;
  name: string;
}

interface LayerControlPanelProps {
  layers: LayerMetadata[],
}

/**
 * Get layer's name or layer's ID to display
 * Otherwise, display "unnamed Layer" as placeholder
 * @param layerMetadata 
 * @returns 
 */
function getLayerDisplayName(layerMetadata: LayerMetadata) {
  if (layerMetadata.name) {
    return layerMetadata.name;
  } else if (layerMetadata.id) {
    return layerMetadata.id;
  } else {
    return "Unnamed Layer";
  }
}

function LayerControlPanel(props: LayerControlPanelProps) {
  return (
    <I18nProvider>
      <EuiPanel paddingSize="s" className='leaflet-control leaflet-control-layer'>
        <EuiTitle size="xs" className='leaflet-control-layer-title'>
          <h2>
            <FormattedMessage
              id="mapsExplorerDashboards.opensearchDashboardsMap.leaflet.layerControlTitle"
              defaultMessage="Layers"
            />
          </h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        {props.layers.map(
          (layerMetadata, idx) => {
            return (
              <LayerControlPanelItem key={"layer" + idx} metadata={layerMetadata} />
            )
          })}
      </EuiPanel>
    </I18nProvider>
  );
}

interface LayerControlPanelItemProps {
  metadata: LayerMetadata,
}

/**
 * Create new layer item
 * Could add future (edit/delete/hide)buttons
 * @param props 
 * @returns 
 */
function LayerControlPanelItem(props: LayerControlPanelItemProps) {
  return (
    <>
      <span>{getLayerDisplayName(props.metadata)}</span>
      <EuiSpacer size="s" />
    </>
  )
}

export { LayerMetadata, LayerControlPanel };
