import { EuiButton, EuiModal, EuiOverlayMask, EuiSpacer, EuiText } from "@elastic/eui";
import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SearchSourceFields } from "../../../../../src/plugins/data/public";
import { Vis, VisType } from "../../../../../src/plugins/visualizations/public";
import { SearchSelection } from "../../../../../src/plugins/visualizations/public";
import { DefaultEditorDataTab, DefaultEditorDataTabProps } from "../../../../../src/plugins/vis_default_editor/public"
import { LayerData } from "../../common/types";
import { getSavedObjects, getUiSettings, getIndexPatternsService } from "../../maps_explorer_dashboards_services";

export interface LayerConfigurationDataProps extends DefaultEditorDataTabProps {
  vis: Vis;
  configLayerId: string
}

function LayerConfigurationData(props: LayerConfigurationDataProps) {
  const { setStateValue, state, configLayerId, vis } = props;
  const [showSearchModal, setSearchModalVisibility] = useState<boolean>(false);
  const [sourceName, setSourceName] = useState<string | undefined>(state.params.layersData[configLayerId]?.searchSourceFields?.index.title);

  //update layer's data
  const setLayerData = <T extends keyof LayerData>(paramName: T, value: LayerData[T]) => {
    setStateValue("layersData", {
      ...state.params.layersData,
      [configLayerId]: {
        ...state.params.layersData[configLayerId],
        [paramName]: value
      }
    });
  }

  const onCloseModal = () => {
    setSearchModalVisibility(false);
  }

  const onSearchSelected = async (searchId: string, searchType: string) => {
    const indexPattern = await getIndexPatternsService().get(searchId);

    const searchSourceFields: SearchSourceFields = {
      index: indexPattern,
      filter: [],
      query: {
        language: 'kuery',
        query: ''
      }
    }
    setLayerData('searchSourceFields', searchSourceFields);
    await vis.setState({
      ...vis.serialize(),
      data: {
        searchSource: searchSourceFields,
        aggs: []
      }
    })
    state.data.aggs = vis.data.aggs;
    state.data.indexPattern = indexPattern;
    setSourceName(indexPattern.title);
    setSearchModalVisibility(false);
  };

  const onClickSelectSearch = () => {
    setSearchModalVisibility(true);
  }
  
  useEffect(() => {
    setLayerData("aggConfigs", state.data.aggs?.aggs);
  }, [state.data.aggs]);

  return (
    <>
      <EuiSpacer size="s" />
      <EuiText size="s">
        <strong>
          <FormattedMessage id="layerControl.searchSource.title" defaultMessage="Source" />
        </strong>
      </EuiText>
      <EuiText size="s">
        {
          sourceName !== undefined ? sourceName
            : <FormattedMessage id="layerControl.searchSource.noSource" defaultMessage="No Source Selected" />
        }
      </EuiText>
      <EuiSpacer size="s" />

      <EuiButton
        onClick={onClickSelectSearch}
        size="s"
      >
        {sourceName !== undefined ?
          <FormattedMessage
            id="layerControl.searchSource.replaceSourceButtonLabel"
            defaultMessage="Replace a source"
          /> :
          <FormattedMessage
            id="layerControl.searchSource.chooseSourceButtonLabel"
            defaultMessage="Choose a source"
          />}
      </EuiButton>

      {showSearchModal &&
        <EuiOverlayMask>
          <EuiModal onClose={onCloseModal} className="visNewVisSearchDialog">
            <SearchSelection
              onSearchSelected={onSearchSelected}
              visType={vis.type as VisType}
              uiSettings={getUiSettings()}
              savedObjects={getSavedObjects()}
            />
          </EuiModal>
        </EuiOverlayMask>
      }

      <EuiSpacer size="l" />

      {
        sourceName && <DefaultEditorDataTab
          {...props}
        />
      }
    </>
  )
}

export { LayerConfigurationData };
