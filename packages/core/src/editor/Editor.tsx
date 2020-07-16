import React, { useEffect } from 'react';

import { Options } from '../interfaces';
import { DefaultEventHandlers, Events } from '../events';

import { useEditorStore } from './store';
import { EditorContext } from './EditorContext';

export const withDefaults = (options: Partial<Options> = {}) => ({
  onNodesChange: () => null,
  onRender: ({ render }) => render,
  resolver: {},
  nodes: null,
  enabled: true,
  indicator: {
    error: 'red',
    success: 'rgb(98, 196, 98)',
  },
  handlers: (store) => new DefaultEventHandlers(store),
  ...options,
});

/**
 * A React Component that provides the Editor context
 */
export const Editor: React.FC<Partial<Options>> = ({
  children,
  normaliseNodes,
  ...options
}) => {
  const context = useEditorStore(
    withDefaults(options),
    (_, previousState, actionPerformedWithPatches, query, normaliser) => {
      if (!actionPerformedWithPatches) {
        return;
      }

      const { patches, ...actionPerformed } = actionPerformedWithPatches;

      for (let i = 0; i < patches.length; i++) {
        const { path } = patches[i];
        const isModifyingNodeData =
          path.length > 2 && path[0] === 'nodes' && path[2] === 'data';

        let actionType = actionPerformed.type;

        if (
          ['runWithoutHistory', 'throttleHistory'].includes(actionType) &&
          actionPerformed.params
        ) {
          actionType = actionPerformed.params[0];
        }

        if (
          ['setState', 'deserialize'].includes(actionType) ||
          isModifyingNodeData
        ) {
          if (normaliseNodes) {
            normaliser((draft) => {
              normaliseNodes(draft, previousState, actionPerformed, query);
            });
          }
          break; // we exit the loop as soon as we find a change in node.data
        }
      }
    }
  );

  useEffect(() => {
    if (context && options)
      context.actions.setOptions((editorOptions) => {
        editorOptions = options;
      });
  }, [context, options]);

  useEffect(() => {
    context.subscribe(
      (_) => ({
        json: context.query.serialize(),
      }),
      () => {
        context.query.getOptions().onNodesChange(context.query);
      }
    );
  }, [context]);

  return context ? (
    <EditorContext.Provider value={context}>
      <Events>{children}</Events>
    </EditorContext.Provider>
  ) : null;
};
