/**
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useCallback, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonToggle,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

import { Vis } from 'src/plugins/visualizations/public';
import { discardChanges, EditorAction } from '../../../../../src/plugins/vis_default_editor/public';
import './layer_control_buttons.scss'
import { ConfigMode } from './layer_control';

interface LayerControlButtonsProps {
  isDirty: boolean;
  isInvalid: boolean;
  isTouched: boolean;
  dispatch: React.Dispatch<EditorAction>;
  vis: Vis;
  applyChanges(): void;
  configMode: ConfigMode;
  setConfigLayerId: (configLayerId: string | undefined) => void;
}

/**
 * UI of the create/update and discard/cancel buttons in layer control
 * @param param0 
 * @returns 
 */
function LayerControlButtons({
  isDirty,
  isInvalid,
  isTouched,
  dispatch,
  vis,
  applyChanges,
  configMode,
  setConfigLayerId,
}: LayerControlButtonsProps) {
  const onClickDiscard = useCallback(() => {
    // When creating a new layer, discard will remove the layer entirely
    if (configMode === 'create') {
      setConfigLayerId(undefined);
    }
    dispatch(discardChanges(vis))
  }, [dispatch, vis, configMode]);
  const onClickClose = useCallback(() => setConfigLayerId(undefined), []);
  const onClickCreateAndUpdate = useCallback(() => {
    applyChanges();
    setConfigLayerId(undefined);
  }, [applyChanges]);

  return (
    <div className="layerControl__buttons">
      <EuiFlexGroup justifyContent="spaceBetween" gutterSize="none" responsive={false}>
        {(configMode === 'create' || isDirty) && <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            data-test-subj="layerControlDiscardButton"
            iconType={configMode === 'create' ? "trash" : "cross"}
            onClick={onClickDiscard}
            size="s"
          >
            {configMode === 'create' ? <FormattedMessage
              id="layerControl.button.deleteButtonLabel"
              defaultMessage="Delete"
            /> : <FormattedMessage
              id="layerControl.button.discardButtonLabel"
              defaultMessage="Discard"
            />}
          </EuiButtonEmpty>
        </EuiFlexItem>}
        {configMode === 'edit' && !isDirty && <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            data-test-subj="layerControlCloseButton"
            iconType="sortUp"
            onClick={onClickClose}
            size="s"
          >
            <FormattedMessage
              id="layerControl.button.closeButtonLabel"
              defaultMessage="Close"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>}

        <EuiFlexItem grow={false}>
          {isInvalid && isTouched ? (
            <EuiToolTip
              content={i18n.translate('layerControl.button.errorButtonTooltip', {
                defaultMessage: 'Errors in the input fields need to be resolved.',
              })}
            >
              <EuiButton color="danger" iconType="alert" size="s" disabled>
                {configMode === 'create' ? <FormattedMessage
                  id="layerControl.button.createChartButtonLabel"
                  defaultMessage="Create"
                /> : <FormattedMessage
                  id="layerControl.button.updateChartButtonLabel"
                  defaultMessage="Update"
                />}
              </EuiButton>
            </EuiToolTip>
          ) : (
            <EuiButton
              data-test-subj="layerControlUpdateButton"
              disabled={!isDirty}
              fill
              iconType="play"
              onClick={onClickCreateAndUpdate}
              size="s"
            >
              {configMode === 'create' ? <FormattedMessage
                id="layerControl.button.createChartButtonLabel"
                defaultMessage="Create"
              /> : <FormattedMessage
                id="layerControl.button.updateChartButtonLabel"
                defaultMessage="Update"
              />}
            </EuiButton>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}

export { LayerControlButtons };
