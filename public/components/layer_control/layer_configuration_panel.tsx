import './layer_configuration_panel.scss';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useState } from "react";
import { DefaultEditorNavBar, OptionTab } from "../../../../../src/plugins/vis_default_editor/public";
import { LayerConfigurationOptions } from "./layer_configuration_options";
import { ConfigMode } from "./layer_control";
import { DefaultEditorDataTab } from '../../../../../src/plugins/vis_default_editor/public';
import { LayerTypes } from '../../common/types';

const OPTIONS_CONFIGURATION_TAB: OptionTab = {
  editor: LayerConfigurationOptions,
  name: 'options',
  title: i18n.translate('visDefaultEditor.sidebar.tabs.optionsLabel', {
    defaultMessage: 'Options',
  }),
  isSelected: true};

const DATA_CONFIGURATION_TAB: OptionTab = {
  editor: DefaultEditorDataTab,
  name: 'data',
  title: i18n.translate('visDefaultEditor.sidebar.tabs.dataLabel', {
    defaultMessage: 'Data',
  }),
  isSelected: false};

interface LayerConfigurationPanelProps {
  dataTabProps: any;
  optionTabProps: any;
  stateParams: any;
  configLayerId: string | undefined;
  configMode: ConfigMode;
}

/**
 * Layer configuration panel UI
 * Users can edit the layer name in this panel
 * @param param0 
 * @returns 
 */
function LayerConfigurationPanel({
  dataTabProps,
  optionTabProps,
  stateParams,
  configLayerId,
  configMode
}: LayerConfigurationPanelProps) {

  const [optionTabs, setOptionTabs] = useState<OptionTab[]>([]);

  useEffect(() => {
    if(LayerTypes.GeohashLayer === stateParams.layersOptions[configLayerId!].layerType) {
      setOptionTabs([OPTIONS_CONFIGURATION_TAB, DATA_CONFIGURATION_TAB]);
    } else {
      setOptionTabs([OPTIONS_CONFIGURATION_TAB]);
    }
  }, [stateParams.layersOptions[configLayerId!].layerType]);

  const setSelectedTab = useCallback((name: string) => {
    setOptionTabs((tabs) => tabs.map((tab) => ({ ...tab, isSelected: tab.name === name })));
  }, []);

  return (
    <>
      <DefaultEditorNavBar optionTabs={optionTabs} setSelectedTab={setSelectedTab} />
      {optionTabs.map(({ editor: Editor, name, isSelected = false }) => (
        <div
          key={name}
          className={`visEditorSidebar__config ${isSelected ? '' : 'visEditorSidebar__config-isHidden'
            }`}
        >
          <Editor
            isTabSelected={isSelected}
            {...(name === 'data' ? dataTabProps : optionTabProps)}
            configLayerId={configLayerId}
            configMode={configMode}
          />
        </div>
      ))}
    </>
  )
}

export { LayerConfigurationPanel };
