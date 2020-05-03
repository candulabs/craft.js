import React, { useEffect, useRef } from "react";

import { Options } from "../interfaces";
import { Events } from "../events";

import { useEditorStore } from "./store";
import { EditorContext } from "./EditorContext";
import { original } from "immer";

export const withDefaults = (options: Partial<Options> = {}) => ({
  onStateChange: () => null,
  onRender: ({ render }) => render,
  resolver: {},
  nodes: null,
  enabled: true,
  indicator: {
    error: "red",
    success: "rgb(98, 196, 98)",
  },
  ...options,
});

/**
 * A React Component that provides the Editor context
 */
export const Editor: React.FC<Partial<Options>> = ({
  children,
  ...options
}) => {
  const initialised = useRef(false);

  const context = useEditorStore(
    withDefaults(options),
    (patches, draft, type) => {
      if (!initialised.current) {
        return;
      }

      for (let i = 0; i < patches.length; i++) {
        const { path, value } = patches[i];
        // If data is modified:
        if (path.length > 2 && path[0] == "nodes" && path[2] == "data") {
          // Object.keys(draft.nodes).forEach(id => {
          //   const node = draft.nodes[id];
          //   if ( node.data.name == "Button" ) {
          //     node.data.props.size = "large";
          //   }
          // })
          console.log("changed!", patches[i], type);
          break;
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
      ({ json }) => {
        initialised.current = true;
        console.log("test");
        context.query.getOptions().onStateChange(JSON.parse(json));
      }
    );
  }, [context]);

  return context ? (
    <EditorContext.Provider value={context}>
      <Events>{children}</Events>
    </EditorContext.Provider>
  ) : null;
};
