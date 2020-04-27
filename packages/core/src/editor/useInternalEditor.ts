import { useContext, useMemo } from "react";
import { EditorState } from "../interfaces";
import { QueryMethods } from "./query";
import { useCollector, QueryCallbacksFor } from "@candulabs/craft-utils";
import { ActionMethodsWithConfig } from "./store";
import { useEventHandler } from "../events/EventContext";
import { EditorContext } from "./EditorContext";
import { EventConnectors } from "../events/EventHandlers";

export type EditorCollector<C> = (
  state: EditorState,
  query: QueryCallbacksFor<typeof QueryMethods>
) => C;

export type useInternalEditor<C = null> = (C extends null
  ? useCollector<typeof ActionMethodsWithConfig, typeof QueryMethods>
  : useCollector<typeof ActionMethodsWithConfig, typeof QueryMethods, C>) & {
  inContext: boolean;
  store: EditorContext;
  connectors: EventConnectors;
};

export function useInternalEditor(): useInternalEditor;
export function useInternalEditor<C>(
  collector: EditorCollector<C>
): useInternalEditor<C>;
export function useInternalEditor<C>(collector?: any): useInternalEditor<C> {
  const handlers = useEventHandler();
  const store = useContext<EditorContext>(EditorContext);
  const collected = useCollector(store, collector);

  const connectors = useMemo(() => handlers && handlers.connectors(), [
    handlers,
  ]);

  return {
    ...(collected as any),
    connectors: connectors || {},
    inContext: !!store,
    store,
  };
}
