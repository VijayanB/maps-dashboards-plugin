/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildExpression, buildExpressionFunction } from '../../../src/plugins/expressions/public';
import { Vis } from '../../../src/plugins/visualizations/public';
import { MapsExplorerDashboardsExpressionFunctionDefinition } from './types'

export const toExpressionAst = (vis: Vis) => {
  const { expression, interval } = vis.params;

  const mapsExplorer = buildExpressionFunction<MapsExplorerDashboardsExpressionFunctionDefinition>('maps_explorer_dashboards_vis', {
    expression,
    interval,
  });

  const ast = buildExpression([mapsExplorer]);

  return ast.toAst();
};
