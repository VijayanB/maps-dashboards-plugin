/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useEffect } from "react";
import { EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { SelectOption, TextInputOption } from '../../../../src/plugins/charts/public';
import { VisOptionsProps } from "../../../../src/plugins/vis_default_editor/public";
import { LayerOptions } from "../common/types";

/**
 * Contain all Layers' options
 * Key is layer's id
 * Value is the corresponding layer's options
 */
interface MapsExplorerLayersOptions {
  [id: string]: LayerOptions;
}

/**
 * Schema of stateParams
 */
export interface MapsExplorerVisParams {
  layersOptions: MapsExplorerLayersOptions
  curLayerId: string;
  layerIdOrder: string[]; // The order of layer ids, from the bottom to the top
}

export type MapsExlorerOptionsProps = VisOptionsProps<MapsExplorerVisParams>;

/**
 * Sidebar UI to configure each layer
 * @param props 
 * @returns 
 */
function MapExplorerOptions(props: MapsExlorerOptionsProps) {
  const { stateParams, setValue, vis } = props;

  const setLayerValue = <T extends keyof LayerOptions>(paramName: T, value: LayerOptions[T]) => {
    setValue("layersOptions", {
      ...stateParams.layersOptions,
      [stateParams.curLayerId]: {
        ...stateParams.layersOptions[stateParams.curLayerId],
        [paramName]: value
      }
    });
  }

  return (
    <EuiPanel paddingSize="s">

      <TextInputOption
        label={
          <>
            <FormattedMessage id="mapsExplorer.layerVisParams.nameLabel" defaultMessage="Layer Name" />
            <span aria-hidden="true">*</span>
          </>
        }
        helpText={
          <>
            <FormattedMessage
              id="mapsExplorer.layerVisParams.nameLabelTip"
              defaultMessage="The name of the TMS web service."
            />
          </>
        }
        paramName="name"
        value={stateParams.layersOptions[stateParams.curLayerId].name}
        setValue={setLayerValue}
      />

      <SelectOption
        label={i18n.translate('mapsExplorer.layerVisParams.layerTypeLabel', {
          defaultMessage: 'Layer Type',
        })}
        options={vis.type.editorConfig.collections.layerTypes}
        paramName="layerType"
        value={stateParams.layersOptions[stateParams.curLayerId].layerType}
        setValue={setLayerValue}
      />

    </EuiPanel>
  )
}

export { MapExplorerOptions };

