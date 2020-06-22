import {
  useInternalEditor,
  EditorCollector,
} from "../editor/useInternalEditor";
import { useMemo } from "react";
import { NodeId } from "../interfaces";
import { Overwrite, Delete } from "@candulabs/craft-utils";

export type useEditorReturnType<S = null> = Overwrite<
  useInternalEditor<S>,
  {
    actions: Delete<
      useInternalEditor<S>["actions"],
      "setNodeEvent" | "setDOM" | "replaceNodes" | "reset" | "runWithoutHistory"
    > & {
      selectNode: (nodeId: NodeId | null) => void;
      runWithoutHistory: Delete<
        useInternalEditor<S>["actions"]["runWithoutHistory"],
        "replaceNodes" | "reset"
      >;
    };
    query: Delete<useInternalEditor<S>["query"], "deserialize">;
  }
>;

/**
 * A Hook that that provides methods and information related to the entire editor state.
 * @param collector Collector function to consume values from the editor's state
 */
export function useEditor(): useEditorReturnType;
export function useEditor<S>(
  collect: EditorCollector<S>
): useEditorReturnType<S>;

export function useEditor<S>(collect?: any): useEditorReturnType<S> {
  const {
    connectors,
    actions: {
      setDOM,
      setNodeEvent,
      replaceNodes,
      reset,
      runWithoutHistory: {
        replaceNodes: _,
        replaceEvents: __,
        reset: ___,
        ...runWithoutHistory
      },
      ...EditorActions
    },
    query: { deserialize, ...query },
    store,
    ...collected
  } = useInternalEditor(collect);

  const actions = useMemo(() => {
    return {
      ...EditorActions,
      selectNode: (nodeId: NodeId | null) => {
        setNodeEvent("selected", nodeId);
        setNodeEvent("hovered", null);
      },
      runWithoutHistory,
    };
  }, [EditorActions, runWithoutHistory, setNodeEvent]);

  return {
    connectors,
    actions,
    query,
    store,
    ...(collected as any),
  };
}
