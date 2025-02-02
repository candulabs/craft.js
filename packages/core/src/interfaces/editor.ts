import {
  QueryCallbacksFor,
  Delete,
  PatchListenerAction,
} from '@candulabs/craft-utils';

import { NodeEventTypes, NodeId, Nodes } from './nodes';
import { Placement } from './events';
import { useInternalEditorReturnType } from '../editor/useInternalEditor';
import { ActionMethodsWithConfig, EditorStore } from '../editor/store';
import { QueryMethods } from '../editor/query';
import { CoreEventHandlers } from '../events';

export type Options = {
  onRender: React.ComponentType<{ render: React.ReactElement }>;
  onNodesChange: (query: QueryCallbacksFor<typeof QueryMethods>) => void;
  resolver: Resolver;
  enabled: boolean;
  indicator: Record<'success' | 'error', string>;
  handlers: (store: EditorStore) => CoreEventHandlers;
  normaliseNodes: (
    state: EditorState,
    previousState: EditorState,
    actionPerformed: Delete<
      PatchListenerAction<EditorState, typeof ActionMethodsWithConfig>,
      'patches'
    >,
    query: QueryCallbacksFor<typeof QueryMethods>
  ) => void;
};

export type Resolver = Record<string, string | React.ElementType>;

export interface Indicator {
  placement: Placement;
  error: string | false;
}

export type EditorEvents = Record<NodeEventTypes, Set<NodeId>>;

export type EditorState = {
  nodes: Nodes;
  events: EditorEvents;
  options: Options;
  handlers: CoreEventHandlers;
  indicator: Indicator;
};

export type ConnectedEditor<S = null> = useInternalEditorReturnType<S>;
