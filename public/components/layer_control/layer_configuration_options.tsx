/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useEffect } from "react";
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { SelectOption, TextInputOption } from '../../../../../src/plugins/charts/public';
import { VisOptionsProps } from "../../../../../src/plugins/vis_default_editor/public";
import { LayerOptions } from "../../common/types";
import { configMode } from "./layer_control";

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
  layerIdOrder: string[]; // The order of layer ids, from the bottom to the top
}

export type MapsExlorerOptionsProps = VisOptionsProps<MapsExplorerVisParams> & {
  configLayerId: string;
  configMode: configMode;
};

/**
 * Sidebar UI to configure each layer
 * @param props 
 * @returns 
 */
function LayerConfigurationOptions(props: MapsExlorerOptionsProps) {
  const { stateParams, setValue, vis, setValidity, configLayerId, configMode } = props;

  const setLayerValue = <T extends keyof LayerOptions>(paramName: T, value: LayerOptions[T]) => {
    setValue("layersOptions", {
      ...stateParams.layersOptions,
      [configLayerId]: {
        ...stateParams.layersOptions[configLayerId],
        [paramName]: value
      }
    });
  }

  useEffect(() => {
    if (stateParams.layersOptions[configLayerId].name !== "" && stateParams.layersOptions[configLayerId].layerType) {
      setValidity(true);
    } else {
      setValidity(false);
    }
  }, [stateParams]);

  return (
    <>
      <TextInputOption
        label={
          <>
            <FormattedMessage id="mapsExplorer.layerVisParams.nameLabel" defaultMessage="Layer Name" />
            <span aria-hidden="true">*</span>
          </>
        }
        paramName="name"
        value={stateParams.layersOptions[configLayerId].name}
        setValue={setLayerValue}
      />

      <SelectOption
        label={i18n.translate('mapsExplorer.layerVisParams.layerTypeLabel', {
          defaultMessage: 'Layer Type',
        })}
        options={vis.type.editorConfig.collections.layerTypes}
        paramName="layerType"
        value={stateParams.layersOptions[configLayerId].layerType}
        disabled={configMode === 'edit'}
        setValue={setLayerValue}
      />
    </>
  )
}

export { LayerConfigurationOptions };

