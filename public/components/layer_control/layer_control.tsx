/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { KeyboardEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { keys, EuiPanel, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { LayerCollectionPanel } from './layer_collection_panel';
import { useEditorFormState, discardChanges, Schema, DefaultEditorAggCommonProps, setStateParamValue, useEditorReducer } from '../../../../../src/plugins/vis_default_editor/public';
import { PersistedState, Vis, VisualizeEmbeddableContract } from 'src/plugins/visualizations/public';
import { EventEmitter } from 'events';
import { SavedObject } from 'opensearch-dashboards/server';
import { TimeRange } from 'src/plugins/data/common';
import { isEqual } from 'lodash';
import { LayerConfigurationPanel } from './layer_configuration_panel';
import { I18nProvider } from '@osd/i18n/react';
import './layer_control.scss'
import { LayerControlButtons } from './layer_control_buttons';

/**
 * use ConfigMode to display different UI when users want to 
 * create a new layer or edit an existing layer
 */
export type ConfigMode = 'create' | 'edit';

/**
 * LayerControlPanelProps have all layers' LayerOptions as a list
 */
interface LayerControlProps {
  embeddableHandler: VisualizeEmbeddableContract;
  uiState: PersistedState;
  vis: Vis;
  isLinkedSearch: boolean;
  eventEmitter: EventEmitter;
  savedSearch?: SavedObject;
  timeRange: TimeRange;
}

/**
 * Layer Control Panel UI
 * @param props 
 * @returns 
 */
function LayerControl({
  embeddableHandler,
  uiState,
  vis,
  isLinkedSearch,
  eventEmitter,
  savedSearch,
  timeRange,
}: LayerControlProps) {
  const [isDirty, setDirty] = useState(false);
  const [state, dispatch] = useEditorReducer(vis, eventEmitter);
  const { formState, setTouched, setValidity, resetValidity } = useEditorFormState();
  const [configLayerId, setConfigLayerId] = useState<string | undefined>(undefined);
  const [configMode, setConfigMode] = useState<ConfigMode>('edit');

  const responseAggs = useMemo(() => (state.data.aggs ? state.data.aggs.getResponseAggs() : []), [
    state.data.aggs,
  ]);
  const metricSchemas = (vis.type.schemas.metrics || []).map((s: Schema) => s.name);
  const metricAggs = useMemo(
    () => responseAggs.filter((agg) => agg.schema && metricSchemas.includes(agg.schema)),
    [responseAggs, metricSchemas]
  );
  const hasHistogramAgg = useMemo(() => responseAggs.some((agg) => agg.type.name === 'histogram'), [
    responseAggs,
  ]);

  const setStateValidity = useCallback(
    (value: boolean) => {
      setValidity('visOptions', value);
    },
    [setValidity]
  );

  const setStateValue: DefaultEditorAggCommonProps['setStateParamValue'] = useCallback(
    (paramName, value) => {
      const shouldUpdate = !isEqual(state.params[paramName], value);

      if (shouldUpdate) {
        dispatch(setStateParamValue(paramName, value));
      }
    },
    [dispatch, state.params]
  );

  // apply new data to the visualization
  const applyChanges = useCallback(() => {
    console.log("apply changes")
    if (formState.invalid) {
      setTouched(true);
      return;
    }
    setConfigMode('edit');
    vis.setState({
      ...vis.serialize(),
      params: {
        ...state.params,
        renderLayerIdx: undefined // render all layers one by one
      },
      data: {
        aggs: state.data.aggs ? (state.data.aggs.aggs.map((agg) => agg.toJSON()) as any) : [],
      },
    });
    embeddableHandler.reload();
    eventEmitter.emit('dirtyStateChange', {
      isDirty: false,
    });
    setTouched(false);
    // close the configuration panel after clicking applyChanges()
    setConfigLayerId(undefined);
  }, [vis, state, formState.invalid, setTouched, isDirty, eventEmitter, embeddableHandler]);

  /**
   * useMemo will executate during rendering
   * It will permanently apply the default state params to vis.
   */
  useMemo(() => {
    applyChanges();
  }, []);

  const onSubmit: KeyboardEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      if (event.ctrlKey && event.key === keys.ENTER) {
        event.preventDefault();
        event.stopPropagation();

        applyChanges();
      }
    },
    [applyChanges]
  );

  // subscribe on the options status 
  useEffect(() => {
    const changeHandler = ({ isDirty: dirty }: { isDirty: boolean }) => {
      setDirty(dirty);

      if (!dirty) {
        resetValidity();
      }
    };
    eventEmitter.on('dirtyStateChange', changeHandler);

    return () => {
      eventEmitter.off('dirtyStateChange', changeHandler);
    };
  }, [resetValidity, eventEmitter]);

  // subscribe on external vis changes using browser history, for example press back button
  useEffect(() => {
    const resetHandler = () => dispatch(discardChanges(vis));
    eventEmitter.on('updateEditor', resetHandler);

    return () => {
      eventEmitter.off('updateEditor', resetHandler);
    };
  }, [dispatch, vis, eventEmitter]);

  const dataTabProps = {
    dispatch,
    formIsTouched: formState.touched,
    metricAggs,
    state,
    schemas: vis.type.schemas,
    setValidity,
    setTouched,
    setStateValue,
    timeRange,
    vis,
    configLayerId
  };

  const optionTabProps = {
    aggs: state.data.aggs!,
    hasHistogramAgg,
    stateParams: state.params,
    vis,
    uiState,
    setValue: setStateValue,
    setValidity: setStateValidity,
    setTouched,
    timeRange,
  };

  return (
    <I18nProvider>
      <EuiPanel paddingSize="s" className='layer-panel'>
        <EuiFlexGroup
          responsive={false}
          justifyContent="flexStart"
          direction="column"
          gutterSize='s'
        >
          <EuiFlexItem grow={false}>
            <LayerCollectionPanel
              vis={vis}
              state={state}
              setStateValue={setStateValue}
              configLayerId={configLayerId}
              setConfigLayerId={setConfigLayerId}
              setConfigMode={setConfigMode}
              isConfigDirty={isDirty}
              setConfigDirty={setDirty}
            />
          </EuiFlexItem>
          {configLayerId &&
            <form
              className="visEditorSidebar__form euiFlexItem"
              name="visualizeEditor"
              onKeyDownCapture={onSubmit}
            >
              <LayerConfigurationPanel
                dataTabProps={dataTabProps}
                optionTabProps={optionTabProps}
                stateParams={state.params}
                configLayerId={configLayerId}
                configMode={configMode}
              />
            </form>}
          {<EuiFlexItem grow={false}>
            <LayerControlButtons
              applyChanges={applyChanges}
              dispatch={dispatch}
              isDirty={isDirty}
              isTouched={formState.touched}
              isInvalid={formState.invalid}
              vis={vis}
              configMode={configMode}
              configLayerId={configLayerId}
              setConfigLayerId={setConfigLayerId}
            />
          </EuiFlexItem>}
        </EuiFlexGroup>
      </EuiPanel>
    </I18nProvider >
  );
}

export { LayerControl };
