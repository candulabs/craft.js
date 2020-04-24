import { useMethods, SubscriberAndCallbacksFor } from "@candulabs/craft-utils";
import { Actions } from "./actions";
import { QueryMethods } from "./query";

export type EditorStore = SubscriberAndCallbacksFor<typeof Actions>;

export const useEditorStore = (options): EditorStore => {
  return useMethods(
    {
      methods: Actions as any,
      ignoreHistoryForActions: [
        "setDOM",
        "setNodeEvent",
        "setOptions",
        "setIndicator",
      ],
    },
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
  );
};
