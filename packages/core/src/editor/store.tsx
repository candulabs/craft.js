import {
  useMethods,
  SubscriberAndCallbacksFor,
  PatchListener,
} from '@candulabs/craft-utils';
import { ActionMethods } from './actions';
import { QueryMethods } from './query';
import { EditorState, NodeEventTypes, NodeId } from '../interfaces';

export const editorInitialState = {
  nodes: {},
  events: {
    dragged: new Set<NodeId>(),
    selected: new Set<NodeId>(),
    hovered: new Set<NodeId>(),
  },
  indicator: null,
  handlers: null,
};

export const ActionMethodsWithConfig = {
  methods: ActionMethods,
  ignoreHistoryForActions: [
    'setDOM',
    'setNodeEvent',
    'clearEvents',
    'setOptions',
    'setIndicator',
  ] as const,
  normalizeHistory: (state: EditorState) => {
    /**
     * On every undo/redo, we remove events pointing to deleted Nodes
     */
    Object.keys(state.events).forEach((eventName: NodeEventTypes) => {
      const nodeIds = Array.from(state.events[eventName] || []);

      nodeIds.forEach((id) => {
        if (!state.nodes[id]) {
          state.events[eventName].delete(id);
        }
      });
    });

    // Remove any invalid node[nodeId].events
    // TODO(prev): it's really cumbersome to have to ensure state.events and state.nodes[nodeId].events are in sync
    // Find a way to make it so that once state.events is set, state.nodes[nodeId] automatically reflects that (maybe using proxies?)
    Object.keys(state.nodes).forEach((id) => {
      const node = state.nodes[id];

      Object.keys(node.events).forEach((eventName: NodeEventTypes) => {
        const isEventActive = !!node.events[eventName];

        if (
          isEventActive &&
          state.events[eventName] &&
          !state.events[eventName].has(node.id)
        ) {
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
      ...editorInitialState,
      options,
    },
    QueryMethods,
    patchListener
  ) as EditorStore;
};
