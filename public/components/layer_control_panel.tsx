/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import './layer_control_panel.scss';

function LayerControlPanel() {
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
        <div>Roadmap </div>
        <EuiSpacer size="s" />
      </EuiPanel>
    </I18nProvider>
  );
}

export { LayerControlPanel };
