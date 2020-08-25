import {
  EditorState,
  Indicator,
  NodeId,
  Node,
  Nodes,
  Options,
  NodeTree,
  SerializedNodes,
  NodeEventTypes,
  NodeSelector,
  NodeSelectorType,
} from '../interfaces';
import {
  deprecationWarning,
  ERROR_INVALID_NODEID,
  ROOT_NODE,
  DEPRECATED_ROOT_NODE,
  QueryCallbacksFor,
  ERROR_NOPARENT,
  ERROR_DELETE_TOP_LEVEL_NODE,
  CallbacksFor,
} from '@candulabs/craft-utils';
import { QueryMethods } from './query';
import { fromEntries } from '../utils/fromEntries';
import { removeNodeFromEvents } from '../utils/removeNodeFromEvents';
import invariant from 'tiny-invariant';
import { getNodesFromSelector } from '../utils/getNodesFromSelector';
import { editorInitialState } from './store';

const Methods = (
  state: EditorState,
  query: QueryCallbacksFor<typeof QueryMethods>
) => {
  /** Helper functions */
  const addNodeToParentAtIndex = (
    node: Node,
    parentId: NodeId,
    index?: number
  ) => {
    const parent = getParentAndValidate(parentId);
    // reset the parent node ids
    if (!parent.data.nodes) {
      parent.data.nodes = [];
    }

    if (parent.data.props.children) {
      delete parent.data.props['children'];
    }

    if (index != null) {
      parent.data.nodes.splice(index, 0, node.id);
    } else {
      parent.data.nodes.push(node.id);
    }

    node.data.parent = parent.id;
    state.nodes[node.id] = node;
  };

  const addTreeToParentAtIndex = (
    tree: NodeTree,
    parentId?: NodeId,
    index?: number
  ) => {
    const node = tree.nodes[tree.rootNodeId];

    if (parentId != null) {
      addNodeToParentAtIndex(node, parentId, index);
    }

    if (!node.data.nodes) {
      return;
    }
    // we need to deep clone here...
    const childToAdd = [...node.data.nodes];
    node.data.nodes = [];
    childToAdd.forEach((childId, index) =>
      addTreeToParentAtIndex(
        { rootNodeId: childId, nodes: tree.nodes },
        node.id,
        index
      )
    );
  };

  const getParentAndValidate = (parentId: NodeId): Node => {
    invariant(parentId, ERROR_NOPARENT);
    const parent = state.nodes[parentId];
    invariant(parent, ERROR_INVALID_NODEID);
    return parent;
  };

  return {
    /**
     * @private
     * Add a new linked Node to the editor.
     * Only used internally by the <Element /> component
     *
     * @param tree
     * @param parentId
     * @param id
     */
    addLinkedNodeFromTree(tree: NodeTree, parentId: NodeId, id?: string) {
      const parent = getParentAndValidate(parentId);
      if (!parent.data.linkedNodes) {
        parent.data.linkedNodes = {};
      }

      parent.data.linkedNodes[id] = tree.rootNodeId;

      tree.nodes[tree.rootNodeId].data.parent = parentId;
      state.nodes[tree.rootNodeId] = tree.nodes[tree.rootNodeId];

      addTreeToParentAtIndex(tree);
    },

    /**
     * Add a new Node to the editor.
     *
     * @param nodeToAdd
     * @param parentId
     * @param index
     */
    add(nodeToAdd: Node | Node[], parentId: NodeId, index?: number) {
      // TODO: Deprecate adding array of Nodes to keep implementation simpler
      let nodes = [nodeToAdd];
      if (Array.isArray(nodeToAdd)) {
        deprecationWarning('actions.add(node: Node[])', {
          suggest: 'actions.add(node: Node)',
        });
        nodes = nodeToAdd;
      }
      nodes.forEach((node: Node) => {
        addNodeToParentAtIndex(node, parentId, index);
      });
    },

    /**
     * Add a NodeTree to the editor
     *
     * @param tree
     * @param parentId
     * @param index
     */
    addNodeTree(tree: NodeTree, parentId?: NodeId, index?: number) {
      const node = tree.nodes[tree.rootNodeId];

      if (!parentId) {
        invariant(
          tree.rootNodeId === ROOT_NODE,
          'Cannot add non-root Node without a parent'
        );
        state.nodes[tree.rootNodeId] = node;
      }

      addTreeToParentAtIndex(tree, parentId, index);
    },

    /**
     * Delete a Node
     * @param id
     */
    delete(selector: NodeSelector<NodeSelectorType.Id>) {
      const targets = getNodesFromSelector(state.nodes, selector, {
        existOnly: true,
        idOnly: true,
      });

      targets.forEach(({ node }) => {
        const id = node.id;
        invariant(
          !query.node(id).isTopLevelNode(),
          ERROR_DELETE_TOP_LEVEL_NODE
        );

        const targetNode = state.nodes[id];
        if (targetNode.data.nodes) {
          // we deep clone here because otherwise immer will mutate the node
          // object as we remove nodes
          [...targetNode.data.nodes].forEach((childId) => this.delete(childId));
        }

        const parentChildren = state.nodes[targetNode.data.parent].data.nodes;
        parentChildren.splice(parentChildren.indexOf(id), 1);

        removeNodeFromEvents(state, id);
        delete state.nodes[id];
      });
    },

    deserialize(input: SerializedNodes | string) {
      const dehydratedNodes =
        typeof input == 'string' ? JSON.parse(input) : input;

      const nodePairs = Object.keys(dehydratedNodes).map((id) => {
        let nodeId = id;

        if (id === DEPRECATED_ROOT_NODE) {
          nodeId = ROOT_NODE;
        }

        return [
          nodeId,
          query.parseSerializedNode(dehydratedNodes[id]).toNode(nodeId),
        ];
      });

      this.replaceNodes(fromEntries(nodePairs));
    },

    /**
     * Move a target Node to a new Parent at a given index
     * @param targetId
     * @param newParentId
     * @param index
     */
    move(selector: NodeSelector, newParentId: NodeId, index: number) {
      const targets = getNodesFromSelector(state.nodes, selector, {
        existOnly: true,
      });

      const newParent = state.nodes[newParentId];
      targets.forEach(({ node: targetNode }, i) => {
        const targetId = targetNode.id;
        const currentParentId = targetNode.data.parent;

        query.node(newParentId).isDroppable([targetId], (err) => {
          throw new Error(err);
        });

        const currentParent = state.nodes[currentParentId];
        const currentParentNodes = currentParent.data.nodes;

        currentParentNodes[currentParentNodes.indexOf(targetId)] = 'marked';

        newParent.data.nodes.splice(index + i, 0, targetId);

        state.nodes[targetId].data.parent = newParentId;
        currentParentNodes.splice(currentParentNodes.indexOf('marked'), 1);
      });
    },

    replaceNodes(nodes: Nodes) {
      state.nodes = nodes;
      this.clearEvents();
    },

    clearEvents() {
      this.setNodeEvent('selected', null);
      this.setNodeEvent('hovered', null);
      this.setNodeEvent('dragged', null);
      this.setIndicator(null);
    },

    /**
     * Resets all the editor state.
     */
    reset() {
      state.nodes = {};
      state.events = editorInitialState.events;
    },

    /**
     * Set editor options via a callback function
     *
     * @param cb: function used to set the options.
     */
    setOptions(cb: (options: Partial<Options>) => void) {
      cb(state.options);
    },

    setNodeEvent(
      eventType: NodeEventTypes,
      nodeIdSelector: NodeSelector<NodeSelectorType.Id>
    ) {
      const current = state.events[eventType];
      if (current.size > 0) {
        current.forEach((id) => {
          state.nodes[id].events[eventType] = false;
        });
      }

      state.events[eventType] = new Set();

      if (!nodeIdSelector) {
        return;
      }

      const targets = getNodesFromSelector(state.nodes, nodeIdSelector, {
        idOnly: true,
        existOnly: true,
      });

      const nodeIds: Set<NodeId> = new Set(targets.map(({ node }) => node.id));

      if (nodeIds) {
        nodeIds.forEach((id) => {
          state.nodes[id].events[eventType] = true;
        });
        state.events[eventType] = nodeIds;
      }
    },

    /**
     * Set custom values to a Node
     * @param id
     * @param cb
     */
    setCustom<T extends NodeId>(
      selector: NodeSelector<NodeSelectorType.Id>,
      cb: (data: EditorState['nodes'][T]['data']['custom']) => void
    ) {
      const targets = getNodesFromSelector(state.nodes, selector, {
        idOnly: true,
        existOnly: true,
      });

      targets.forEach(({ node }) => cb(state.nodes[node.id].data.custom));
    },

    /**
     * Given a `id`, it will set the `dom` porperty of that node.
     *
     * @param id of the node we want to set
     * @param dom
     */
    setDOM(id: NodeId, dom: HTMLElement) {
      invariant(state.nodes[id], ERROR_INVALID_NODEID);
      state.nodes[id].dom = dom;
    },

    setIndicator(indicator: Indicator | null) {
      if (
        indicator &&
        (!indicator.placement.parent.dom ||
          (indicator.placement.currentNode &&
            !indicator.placement.currentNode.dom))
      )
        return;
      state.indicator = indicator;
    },

    /**
     * Hide a Node
     * @param id
     * @param bool
     */
    setHidden(id: NodeId, bool: boolean) {
      state.nodes[id].data.hidden = bool;
    },

    /**
     * Update the props of a Node
     * @param id
     * @param cb
     */
    setProp(
      selector: NodeSelector<NodeSelectorType.Id>,
      cb: (props: any) => void
    ) {
      const targets = getNodesFromSelector(state.nodes, selector, {
        idOnly: true,
        existOnly: true,
      });

      targets.forEach(({ node }) => cb(state.nodes[node.id].data.props));
    },

    selectNode(nodeIdSelector?: NodeSelector<NodeSelectorType.Id>) {
      if (nodeIdSelector) {
        const targets = getNodesFromSelector(state.nodes, nodeIdSelector, {
          idOnly: true,
          existOnly: true,
        });

        this.setNodeEvent(
          'selected',
          targets.map(({ node }) => node.id)
        );
      } else {
        this.setNodeEvent('selected', null);
      }

      this.setNodeEvent('hovered', null);
    },
  };
};

export const ActionMethods = (
  state: EditorState,
  query: QueryCallbacksFor<typeof QueryMethods>
) => {
  return {
    ...Methods(state, query),
    setState(
      cb: (state: EditorState, actions: CallbacksFor<typeof Methods>) => void
    ) {
      cb(state, this);
    },
  };
};
