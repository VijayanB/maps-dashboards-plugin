/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import './layer_control_panel.scss';
import { LayerOptions } from '../common/types';

/**
 * LayerControlPanelProps have all layers' LayerOptions as a list
 */
interface LayerControlPanelProps {
  layers: LayerOptions[],
}

/**
 * Layer Control Panel UI
 * @param props 
 * @returns 
 */
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
        <div>
          {props.layers.map(
            (layerOptions) => {
              return (
                <LayerControlPanelItem options={layerOptions} />
              )
            })}
        </div>
      </EuiPanel>
    </I18nProvider>
  );
}

/**
 * Every item in layer control panel has a layer's LayerOptions
 */
interface LayerControlPanelItemProps {
  options: LayerOptions,
}

/**
 * Every Layer control panel item dispalys layer's name
 * Could add future (edit/delete/hide)buttons
 * @param props 
 * @returns 
 */
function LayerControlPanelItem(props: LayerControlPanelItemProps) {
  return (
    <>
      <span key={props.options.id + '_name'}>{props.options.name}</span>
      <EuiSpacer key={props.options.id + '_spacer'} size="s" />
    </>
  )
}

export { LayerOptions, LayerControlPanel };
