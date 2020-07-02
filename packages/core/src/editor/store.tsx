import {
  useMethods,
  SubscriberAndCallbacksFor,
  PatchListener,
} from "@candulabs/craft-utils";
import { Actions } from "./actions";
import { QueryMethods } from "./query";
import { EditorState } from "../interfaces";

export const ActionMethodsWithConfig = {
  methods: Actions,
  ignoreHistoryForActions: [
    "setDOM",
    "setNodeEvent",
    "setOptions",
    "setIndicator",
  ] as const,
  normalizeHistory: (state) => {
    /**
     * On every undo/redo, we remove events pointing to deleted Nodes
     */

    Object.keys(state.events).forEach((eventName) => {
      const nodeId = state.events[eventName];

      if (!!nodeId && !state.nodes[nodeId]) {
        state.events[eventName] = false;
      }
    });

    Object.keys(state.nodes, (id) => {
      const node = state.nodes[id];

      Object.keys(node.events).forEach((eventName) => {
        const isEventActive = node.events[eventName];

        if (!!isEventActive && !state.events[eventName] !== node.id) {
          node.events[eventName] = false;
        }
      });
    });
  },
};

export type EditorStore = SubscriberAndCallbacksFor<
  typeof ActionMethodsWithConfig,
  typeof QueryMethods
>;

export const useEditorStore = (
  options,
  patchListener: PatchListener<
    EditorState,
    typeof ActionMethodsWithConfig,
    typeof QueryMethods
  >
): EditorStore => {
  return useMethods(
    ActionMethodsWithConfig,
    {
      nodes: {},
      events: {
        selected: null,
        dragged: null,
        hovered: null,
        indicator: null,
      },
      options,
    },
    QueryMethods,
    patchListener
  ) as EditorStore;
};
