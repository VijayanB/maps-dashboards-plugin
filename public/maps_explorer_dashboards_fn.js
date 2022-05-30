import { i18n } from '@osd/i18n';

export const createMapsExplorerDashboardsFn = () => ({
  name: 'maps_explorer_dashboards',
  type: 'render',
  context: {
    types: ['opensearch_dashboards_datatable'],
  },
  //TODO: update the string ID
  help: i18n.translate('mapsExplorerDashboards.function.help', {
    defaultMessage: 'Maps Explorer Dashboards visualization',
  }),
  args: {
    visConfig: {
      types: ['string', 'null'],
      default: '"{}"',
    },
  },
  fn(context, args) {
    const visConfig = JSON.parse(args.visConfig);
    const { geohash, metric, geocentroid } = visConfig.dimensions;
    const convertedData = convertToGeoJson(context, {
      geohash,
      metric,
      geocentroid,
    });

    if (geohash && geohash.accessor) {
      convertedData.meta.geohash = context.columns[geohash.accessor].meta;
    }

    return {
      type: 'render',
      as: 'visualization',
      value: {
        visData: convertedData,
        visType: 'maps_explorer_dashboards',
        visConfig,
        params: {
          listenOnChange: true,
        },
      },
    };
  },
});
