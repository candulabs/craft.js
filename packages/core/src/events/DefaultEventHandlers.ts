import { defineEventListener, CraftDOMEvent } from '@candulabs/craft-utils';
import { createShadow } from './createShadow';
import { Indicator, NodeId, NodeTree } from '../interfaces';
import { CoreEventHandlers } from './CoreEventHandlers';

type DraggedElement = NodeId[] | NodeTree;

type DefaultEventHandlersOptions = {
  isMultiSelectEnabled: (e) => boolean;
};

/**
 * Specifies Editor-wide event handlers and connectors
 */
export class DefaultEventHandlers extends CoreEventHandlers {
  static draggedElementShadow: HTMLElement;
  static draggedElement: DraggedElement;
  static events: { indicator: Indicator } = {
    indicator: null,
  };

  options: DefaultEventHandlersOptions;
  constructor(store, options?: DefaultEventHandlersOptions) {
    super(store);
    this.options = {
      isMultiSelectEnabled: (e: MouseEvent) => !!e.metaKey,
      ...(options || {}),
    };
  }

  handlers() {
    return {
      select: {
        init: () => () => this.store.actions.setNodeEvent('selected', null),
        events: [
          defineEventListener(
            'mousedown',
            (e: CraftDOMEvent<MouseEvent>, id: NodeId) => {
              e.craft.stopPropagation();

              const { query } = this.store;

              const selectedElementIds = query.getEvent('selected');

              // Remove self and any selected element that is a descendant/ancestor of the current node
              const newSelectedElementIds = selectedElementIds.filter(
                (selectedId) => {
                  const descendants = query.node(selectedId).descendants(true),
                    ancestors = query.node(selectedId).ancestors(true);

                  if (
                    descendants.includes(id) ||
                    ancestors.includes(id) ||
                    selectedId === id
                  ) {
                    return false;
                  }

                  return true;
                }
              );

              // This condition is so we can deselect the current Node if it's clicked on again during multi-select
              if (
                !selectedElementIds.includes(id) ||
                !this.options.isMultiSelectEnabled(e)
              ) {
                newSelectedElementIds.push(id);
              }

              this.store.actions.setNodeEvent(
                'selected',
                newSelectedElementIds
              );
            }
          ),
          defineEventListener('click', (e: CraftDOMEvent<MouseEvent>, id) => {
            e.craft.stopPropagation();

            if (this.options.isMultiSelectEnabled(e)) {
              return;
            }

            this.store.actions.setNodeEvent('selected', [id]);
          }),
        ],
      },
      hover: {
        init: () => () => this.store.actions.setNodeEvent('hovered', null),
        events: [
          defineEventListener(
            'mouseover',
            (e: CraftDOMEvent<MouseEvent>, id: NodeId) => {
              e.craft.stopPropagation();
              this.store.actions.setNodeEvent('hovered', id);
            }
          ),
        ],
      },
      drop: {
        events: [
          defineEventListener('dragover', (e: CraftDOMEvent<MouseEvent>) => {
            e.craft.stopPropagation();
            e.preventDefault();
          }),
          defineEventListener(
            'dragenter',
            (e: CraftDOMEvent<MouseEvent>, targetId: NodeId) => {
              e.craft.stopPropagation();
              e.preventDefault();

              const draggedElement = DefaultEventHandlers.draggedElement as NodeTree;
              if (!draggedElement) {
                return;
              }

              const node = draggedElement.rootNodeId
                ? draggedElement.nodes[draggedElement.rootNodeId]
                : draggedElement;
              const { clientX: x, clientY: y } = e;
              const indicator = this.store.query.getDropPlaceholder(
                node,
                targetId,
                { x, y }
              );

              if (!indicator) {
                return;
              }
              this.store.actions.setIndicator(indicator);
              DefaultEventHandlers.events = { indicator };
            }
          ),
        ],
      },

      drag: {
        init: (el, id) => {
          if (!this.store.query.node(id).isDraggable()) {
            return () => {};
          }

          el.setAttribute('draggable', 'true');
          return () => el.setAttribute('draggable', 'false');
        },
        events: [
          defineEventListener(
            'dragstart',
            (e: CraftDOMEvent<DragEvent>, id: NodeId) => {
              e.craft.stopPropagation();

              const { query, actions } = this.store;
              let selectedElementIds = query.getEvent('selected');

              actions.setNodeEvent('dragged', selectedElementIds);

              const selectedDOMs = selectedElementIds.map(
                (id) => query.node(id).get().dom
              );

              DefaultEventHandlers.draggedElementShadow = createShadow(
                e,
                query.node(id).get().dom,
                selectedDOMs
              );
              DefaultEventHandlers.draggedElement = selectedElementIds;
            }
          ),
          defineEventListener('dragend', (e: CraftDOMEvent<DragEvent>) => {
            e.craft.stopPropagation();
            const onDropElement = (draggedElement, placement) => {
              const index =
                placement.index + (placement.where === 'after' ? 1 : 0);
              this.store.actions.move(
                draggedElement,
                placement.parent.id,
                index
              );
            };
            this.dropElement(onDropElement);
          }),
        ],
      },
      create: {
        init: (el) => {
          el.setAttribute('draggable', 'true');
          return () => el.removeAttribute('draggable');
        },
        events: [
          defineEventListener(
            'dragstart',
            (e: CraftDOMEvent<DragEvent>, userElement: React.ReactElement) => {
              e.craft.stopPropagation();
              const tree = this.store.query
                .parseReactElement(userElement)
                .toNodeTree();

              const dom = e.currentTarget as HTMLElement;

              DefaultEventHandlers.draggedElementShadow = createShadow(e, dom, [
                dom,
              ]);
              DefaultEventHandlers.draggedElement = tree;
            }
          ),
          defineEventListener('dragend', (e: CraftDOMEvent<DragEvent>) => {
            e.craft.stopPropagation();
            const onDropElement = (draggedElement, placement) => {
              const index =
                placement.index + (placement.where === 'after' ? 1 : 0);
              this.store.actions.addNodeTree(
                draggedElement,
                placement.parent.id,
                index
              );
            };
            this.dropElement(onDropElement);
          }),
        ],
      },
    };
  }

  private dropElement(
    onDropNode: (
      draggedElement: DraggedElement,
      placement: Indicator['placement']
    ) => void
  ) {
    const {
      draggedElement,
      draggedElementShadow,
      events,
    } = DefaultEventHandlers;
    if (draggedElement && events.indicator && !events.indicator.error) {
      const { placement } = events.indicator;
      onDropNode(draggedElement, placement);
    }

    if (draggedElementShadow) {
      draggedElementShadow.parentNode.removeChild(draggedElementShadow);
      DefaultEventHandlers.draggedElementShadow = null;
    }

    DefaultEventHandlers.draggedElement = null;
    DefaultEventHandlers.events.indicator = null;

    this.store.actions.setIndicator(null);
    this.store.actions.setNodeEvent('dragged', null);
  }
}
