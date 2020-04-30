import React from "react";
import {
  NodeId,
  EditorState,
  Indicator,
  Node,
  Options,
  NodeInfo,
  SerializedNodeData,
  Tree,
  NodeData,
} from "../interfaces";
import invariant from "tiny-invariant";
import {
  QueryCallbacksFor,
  ROOT_NODE,
  ERRROR_NOT_IN_RESOLVER,
  ERROR_MOVE_TO_NONCANVAS_PARENT,
  ERROR_MOVE_OUTGOING_PARENT,
  ERROR_MOVE_INCOMING_PARENT,
  ERROR_MOVE_TO_DESCENDANT,
  ERROR_MOVE_NONCANVAS_CHILD,
  ERROR_DUPLICATE_NODEID,
  getDOMInfo,
  ERROR_CANNOT_DRAG,
  ERROR_MOVE_TOP_LEVEL_CANVAS,
  ERROR_MOVE_ROOT_NODE,
  ERROR_INVALID_NODE_ID,
} from "@candulabs/craft-utils";
import findPosition from "../events/findPosition";
import { createNode } from "../utils/createNode";
import { deprecatedWarning } from "../utils/deprecatedWarning";
import { mergeTrees } from "../utils/mergeTrees";
import { getDeepNodes } from "../utils/getDeepNodes";
import { parseNodeDataFromJSX } from "../utils/parseNodeDataFromJSX";
import { serializeNode } from "../utils/serializeNode";
import { randomNodeId } from "../utils/randomNodeId";
import { resolveComponent } from "../utils/resolveComponent";

export function QueryMethods(state: EditorState) {
  const options = state && state.options;

  const _: () => QueryCallbacksFor<typeof QueryMethods> = () =>
    QueryMethods(state);

  const getNodeFromIdOrNode = (node: NodeId | Node) =>
    typeof node === "string" ? state.nodes[node] : node;

  return {
    /**
     * Get a Node representing the specified React Element
     * @param reactElement
     * @param extras
     */
    createNode(reactElement: React.ReactElement | string, extras?: any): Node {
      deprecatedWarning(
        "Warning: method createNode has been deprecated and it will be removed in the future. Please use parseNodeFromReactNode instead."
      );
      return this.parseNodeFromReactNode(reactElement, extras);
    },

    /**
     * Given a `nodeData` and an optional Id, it will parse a new `Node`
     *
     * @param nodeData `node.data` property of the future data
     * @param id an optional ID correspondent to the node
     */
    parseNodeFromSerializedNode(nodeData: NodeData, id?: NodeId): Node {
      const node = createNode(nodeData, id || randomNodeId());

      const name = resolveComponent(options.resolver, node.data.type);
      invariant(name !== null, ERRROR_NOT_IN_RESOLVER);
      node.data.displayName = node.data.displayName || name;
      node.data.name = name;

      return node;
    },

    parseNodeFromReactNode(
      reactElement: React.ReactElement | string,
      extras: any = {}
    ): Node {
      const nodeData = parseNodeDataFromJSX(reactElement, extras.data);
      return this.parseNodeFromSerializedNode(nodeData, extras.id);
    },

    parseTreeFromReactNode(reactNode: React.ReactElement): Tree | undefined {
      const node = this.parseNodeFromReactNode(reactNode);
      const childrenNodes = React.Children.map(
        (reactNode.props && reactNode.props.children) || [],
        (child) =>
          React.isValidElement(child) && this.parseTreeFromReactNode(child)
      ).filter((children) => !!children);

      return mergeTrees(node, childrenNodes);
    },

    /**
     * Determine the best possible location to drop the source Node relative to the target Node
     */
    getDropPlaceholder: (
      source: NodeId | Node,
      target: NodeId,
      pos: { x: number; y: number },
      nodesToDOM: (node: Node) => HTMLElement = (node) =>
        state.nodes[node.id].dom
    ) => {
      if (source === target) return;
      const sourceNodeFromId = typeof source == "string" && state.nodes[source],
        targetNode = state.nodes[target],
        isTargetCanvas = _().node(targetNode.id).isCanvas();

      const targetParent = isTargetCanvas
        ? targetNode
        : state.nodes[targetNode.data.parent];

      const targetParentNodes = targetParent.data._childCanvas
        ? Object.values(targetParent.data._childCanvas)
        : targetParent.data.nodes || [];

      const dimensionsInContainer = targetParentNodes
        ? targetParentNodes.reduce((result, id: NodeId) => {
            const dom = nodesToDOM(state.nodes[id]);
            if (dom) {
              const info: NodeInfo = {
                id,
                ...getDOMInfo(dom),
              };

              result.push(info);
            }
            return result;
          }, [] as NodeInfo[])
        : [];

      const dropAction = findPosition(
        targetParent,
        dimensionsInContainer,
        pos.x,
        pos.y
      );
      const currentNode =
        targetParentNodes.length &&
        state.nodes[targetParentNodes[dropAction.index]];

      const output: Indicator = {
        placement: {
          ...dropAction,
          currentNode,
        },
        error: false,
      };

      // If source Node is already in the editor, check if it's draggable
      if (sourceNodeFromId) {
        _()
          .node(sourceNodeFromId.id)
          .isDraggable((err) => (output.error = err));
      }

      // Check if source Node is droppable in target
      _()
        .node(targetParent.id)
        .isDroppable(source, (err) => (output.error = err));

      return output;
    },

    /**
     * Get the current Editor options
     */
    getOptions(): Options {
      return options;
    },

    getState(): Record<NodeId, SerializedNodeData> {
      return Object.keys(state.nodes).reduce((result: any, id: NodeId) => {
        const { data } = state.nodes[id];
        result[id] = serializeNode(data, options.resolver);
        return result;
      }, {});
    },

    /**
     * Helper methods to describe the specified Node
     * @param id
     */
    node(id: NodeId) {
      invariant(typeof id == "string", ERROR_INVALID_NODE_ID);

      const node = state.nodes[id];
      const nodeQuery = _().node;

      return {
        isCanvas: () => node.data.isCanvas,
        isRoot: () => node.id === ROOT_NODE,
        isTopLevelCanvas: () =>
          !nodeQuery(node.id).isRoot() &&
          !node.data.parent.startsWith("canvas-"),
        isDeletable: () =>
          !nodeQuery(id).isRoot() &&
          (nodeQuery(id).isCanvas() ? !nodeQuery(id).isTopLevelCanvas() : true),
        isParentOfTopLevelCanvas: () => !!node.data._childCanvas,
        get: () => node,
        ancestors: (result = []) => {
          const parent = node.data.parent;
          if (parent) {
            result.push(parent);
            nodeQuery(parent).ancestors(result);
          }
          return result;
        },
        decendants: (deep = false) => {
          return getDeepNodes(state.nodes, id, deep);
        },
        isDraggable: (onError?: (err: string) => void) => {
          try {
            const targetNode = node;
            invariant(!nodeQuery(targetNode.id).isRoot(), ERROR_MOVE_ROOT_NODE);
            if (!nodeQuery(targetNode.id).isRoot()) {
              invariant(
                nodeQuery(targetNode.data.parent).isCanvas() === true,
                ERROR_MOVE_TOP_LEVEL_CANVAS
              );
              invariant(
                targetNode.rules.canDrag(targetNode, _().node),
                ERROR_CANNOT_DRAG
              );
            }
            return true;
          } catch (err) {
            if (onError) onError(err);
            return false;
          }
        },
        isDroppable: (
          target: NodeId | Node,
          onError?: (err: string) => void
        ) => {
          try {
            const targetNode = getNodeFromIdOrNode(target);

            const currentParentNode =
                targetNode.data.parent && state.nodes[targetNode.data.parent],
              newParentNode = node;

            invariant(
              currentParentNode ||
                (!currentParentNode && !state.nodes[targetNode.id]),
              ERROR_DUPLICATE_NODEID
            );

            invariant(
              nodeQuery(newParentNode.id).isCanvas(),
              ERROR_MOVE_TO_NONCANVAS_PARENT
            );
            invariant(
              newParentNode.rules.canMoveIn(
                targetNode,
                newParentNode,
                _().node
              ),
              ERROR_MOVE_INCOMING_PARENT
            );

            if (currentParentNode) {
              const targetDeepNodes = nodeQuery(targetNode.id).decendants();
              invariant(targetNode.data.parent, ERROR_MOVE_NONCANVAS_CHILD);
              invariant(
                !targetDeepNodes.includes(newParentNode.id),
                ERROR_MOVE_TO_DESCENDANT
              );
              invariant(
                currentParentNode.rules.canMoveOut(
                  targetNode,
                  currentParentNode,
                  _().node
                ),
                ERROR_MOVE_OUTGOING_PARENT
              );
            }
            return true;
          } catch (err) {
            if (onError) onError(err);
            return false;
          }
        },
      };
    },

    /**
     * Retrieve the JSON representation of the editor's Nodes
     */
    serialize(): string {
      return JSON.stringify(this.getState());
    },
  };
}
