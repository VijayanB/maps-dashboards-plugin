/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import './layer_collection_panel.scss';
import React from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiTitle, EuiListGroup, EuiCallOut, EuiText, EuiButtonToggle } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import './layer_collection_panel.scss';
import { DEFAULT_NEW_LAYER_OPTIONS, LayerOptions } from '../../common/types';
import { cloneDeep } from 'lodash';
import { EditorVisState } from 'src/plugins/vis_default_editor/public';
import { Vis, VisParams } from 'src/plugins/visualizations/public';
import { v4 as uuidv4 } from 'uuid';
import { ConfigMode } from './layer_control';
import { getIndexPatternsService } from '../../maps_explorer_dashboards_services';

interface LayerCollectionPanelProps {
  vis: Vis;
  state: EditorVisState;
  setStateValue: <T extends string | number>(paramName: T, value: VisParams[T]) => void;
  configLayerId: string | undefined;
  setConfigLayerId: (configLayerId: string | undefined) => void;
  setConfigMode: (configMode: ConfigMode) => void;
  isConfigDirty: boolean; // Whether the layer configuration panel has pending changes.
  setConfigDirty(isDirty: boolean): void;
}
/**
 * Layer Collection Panel UI
 * @param props 
 * @returns 
 */
function LayerCollectionPanel({
  vis,
  state,
  setStateValue,
  configLayerId,
  setConfigLayerId,
  setConfigMode,
  isConfigDirty,
  setConfigDirty
}: LayerCollectionPanelProps) {

  const addNewLayer = () => {
    const newLayerIdOrder = cloneDeep(state.params.layerIdOrder);
    const newLayersOptions = cloneDeep(state.params.layersOptions);
    const newLayerId = "layer_" + uuidv4();
    newLayerIdOrder.push(newLayerId);
    newLayersOptions[newLayerId] = {
      ...DEFAULT_NEW_LAYER_OPTIONS,
      id: newLayerId,
    }
    setStateValue('layerIdOrder', newLayerIdOrder);
    setStateValue('layersOptions', newLayersOptions);
    setConfigMode('create');
    setConfigLayerId(newLayerId);
  }

  const editLayer = async (layerId: string) => {
    setConfigLayerId(layerId);
    setConfigMode('edit');

    const layerData = state.params.layersData[layerId];
    const indexPattern = await getIndexPatternsService().get(layerData.searchSourceFields.index.id);

    await vis.setState({
      ...vis.serialize(),
      data: {
        searchSource: {
          ...layerData.searchSourceFields,
          index: indexPattern
        },
        aggs: layerData.aggConfigs
      }
    })
    state.data.aggs = vis.data.aggs;
    state.data.indexPattern = indexPattern;
  }

  const hideLayer = (layerId: string) => {
    const oldLayersOptions = cloneDeep(state.params.layersOptions);
    oldLayersOptions[layerId] = {
      ...oldLayersOptions[layerId],
      isHidden: !oldLayersOptions[layerId].isHidden,
    }
    setStateValue('layersOptions', oldLayersOptions);
    setConfigDirty(true);
  }

  const deleteLayer = (layerId: string) => {
    // close the layer configuration panel first if this layer is selected to be deleted
    if (layerId === configLayerId) {
      setConfigLayerId(undefined);
    }

    const newLayerIdOrder = state.params.layerIdOrder.filter((id: string) => id !== layerId);
    const newLayersOptions = cloneDeep(state.params.layersOptions);
    delete newLayersOptions[layerId];
    setStateValue('layerIdOrder', newLayerIdOrder);
    setStateValue('layersOptions', newLayersOptions);
    setConfigDirty(true);
  }
  return (
    <>
      <EuiFlexGroup responsive={false} justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiTitle size="xs" className='layer-panel-title'>
            <h2>
              <FormattedMessage
                id="mapsExplorerDashboards.opensearchDashboardsMap.layerControlTitle"
                defaultMessage="Layers"
              />
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            size="s"
            iconType="plusInCircle"
            disabled={isConfigDirty}
            aria-label={"Add Layer"}
            onClick={() => { addNewLayer() }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {state.params.layerIdOrder.length === 0 ?
        <EuiCallOut
          size="s"
          title={<FormattedMessage
            id="mapsExplorerDashboards.opensearchDashboardsMap.addNewLayerInfo"
            defaultMessage="Use add icon to add your first layer."
          />}
          iconType="alert">

        </EuiCallOut> :
        <EuiListGroup flush={true} gutterSize='none'>
          {state.params.layerIdOrder
            .map((layerId: string) => state.params.layersOptions[layerId])
            .map((layerOptions: LayerOptions) => {
              return (
                <LayerCollectionPanelItem
                  configLayerId={configLayerId}
                  options={layerOptions}
                  editLayer={editLayer}
                  deleteLayer={deleteLayer}
                  hideLayer={hideLayer}
                  isConfigDirty={isConfigDirty}
                />
              )
            })}
        </EuiListGroup>
      }
    </>
  );
}

/**
 * Every item in layer collection panel has a layer's LayerOptions
 */
interface LayerCollectionPanelItemProps {
  configLayerId: string | undefined;
  options: LayerOptions,
  editLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  hideLayer: (layerId: string) => void;
  isConfigDirty: boolean;
}

/**
 * Every Layer_collection_panel_item dispalys layer's name
 * Could add future (edit/delete/hide)buttons
 * @param props 
 * @returns 
 */
function LayerCollectionPanelItem(props: LayerCollectionPanelItemProps) {
  const { configLayerId, options, editLayer, deleteLayer, hideLayer, isConfigDirty } = props;
  return (
    <EuiFlexGroup 
    gutterSize="none" 
    alignItems="center"
    >

      <EuiFlexItem grow={8}>
        <EuiText
          color={(configLayerId !== undefined && configLayerId !== options.id)
            || options.isHidden? "subdued": "default"}
          >
          {options.name}
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem grow={1}>
        <EuiButtonToggle
          isDisabled={(configLayerId !== undefined && configLayerId !== options.id)
            || options.isHidden}
          label='Edit'
          iconType="wrench"
          onChange={configLayerId !== undefined && isConfigDirty ? () => { } : () => editLayer(options.id)}
          isEmpty
          isIconOnly
       />
      </EuiFlexItem>

      <EuiFlexItem grow={1}>
        <EuiButtonToggle
          // disable the button
          isDisabled={configLayerId !== undefined && configLayerId !== options.id}
          label="Hide"
          iconType={options.isHidden ? 'eyeClosed' : 'eye'}
          onChange={() => hideLayer(options.id)}
          isSelected={options.isHidden}
          isEmpty
          isIconOnly
        />
      </EuiFlexItem>

      <EuiFlexItem grow={1}>
        <EuiButtonToggle
        isDisabled={(configLayerId !== undefined && configLayerId !== options.id)
          || options.isHidden}
          label='Delete'
          onChange={() => deleteLayer(options.id)}
          iconType="trash"
          isEmpty
          isIconOnly
          />
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

export { LayerOptions, LayerCollectionPanel };
