import { useMethods, SubscriberAndCallbacksFor } from "@candulabs/craft-utils";
import { Actions } from "./actions";
import { QueryMethods } from "./query";

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
     * On every undo/redo, we want to reset these values
     * because their changes are not tracked by the history manager
     */
    state.events = {
      selected: null,
      dragged: null,
      hovered: null,
      indicator: null,
    };
  },
};

export type EditorStore = SubscriberAndCallbacksFor<
  typeof ActionMethodsWithConfig,
  typeof QueryMethods
>;

export const useEditorStore = (options): EditorStore => {
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
    QueryMethods
  ) as EditorStore;
};
