import {
  useInternalEditor,
  EditorCollector,
  useInternalEditorReturnType,
} from '../editor/useInternalEditor';
import { useMemo } from 'react';
import { NodeId } from '../interfaces';

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
type Delete<T, U> = Pick<T, Exclude<keyof T, U>>;

export type useEditorReturnType<S = null> = Overwrite<
  useInternalEditorReturnType<S>,
  {
    actions: Delete<
      useInternalEditorReturnType<S>['actions'],
      | 'addLinkedNodeFromTree'
      | 'setNodeEvent'
      | 'setDOM'
      | 'replaceNodes'
      | 'reset'
    > & {
      selectNode: (nodeId: NodeId | null) => void;
    };
    query: Delete<useInternalEditorReturnType<S>['query'], 'deserialize'>;
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
      addLinkedNodeFromTree,
      setDOM,
      setNodeEvent,
      replaceNodes,
      reset,
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
        setNodeEvent('selected', nodeId);
        setNodeEvent('hovered', null);
      },
    };
  }, [EditorActions, setNodeEvent]);

  return {
    connectors,
    actions,
    query,
    store,
    ...(collected as any),
  };
}
