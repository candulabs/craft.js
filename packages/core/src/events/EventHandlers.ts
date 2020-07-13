import { createShadow, createShadowMultiple } from './createShadow';
import { Indicator, NodeId, NodeTree } from '../interfaces';
import {
  ConnectorsForHandlers,
  defineEventListener,
  Handlers,
  CraftDOMEvent,
} from '@candulabs/craft-utils';
import { EditorStore } from '../editor/store';

type DraggedElement = NodeId[] | NodeTree;

/**
 * Specifies Editor-wide event handlers and connectors
 */
export class EventHandlers extends Handlers<
  'select' | 'hover' | 'drag' | 'drop' | 'create'
> {
  static draggedElementShadow: HTMLElement;
  static draggedElement: DraggedElement;
  static events: { indicator: Indicator } = {
    indicator: null,
  };

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

              let selectedElementIds = query.getEvent('selected');

              // Remove any selected element that is a descendant/ancestor of the current node
              selectedElementIds = selectedElementIds.filter((selectedId) => {
                const descendants = query.node(selectedId).descendants(true),
                  ancestors = query.node(selectedId).ancestors(true);

                if (descendants.includes(id) || ancestors.includes(id)) {
                  return false;
                }

                return true;
              });

              this.store.actions.setNodeEvent('selected', [
                ...selectedElementIds,
                id,
              ]);
            }
          ),
          defineEventListener('click', (e, id) => {
            e.craft.stopPropagation();

            if (e.metaKey) {
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

              const draggedElement = EventHandlers.draggedElement as NodeTree;
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
              EventHandlers.events = { indicator };
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

              EventHandlers.draggedElementShadow = createShadowMultiple(
                e,
                query.node(id).get().dom,
                selectedDOMs
              );
              EventHandlers.draggedElement = selectedElementIds;
            }
          ),
          defineEventListener('dragend', (e: CraftDOMEvent<DragEvent>) => {
            e.craft.stopPropagation();
            const onDropElement = (draggedElement, placement) => {
              draggedElement.forEach((dragId) => {
                this.store.actions.move(
                  dragId as NodeId,
                  placement.parent.id,
                  placement.index + (placement.where === 'after' ? 1 : 0)
                );
              });
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

              EventHandlers.draggedElementShadow = createShadow(e);
              EventHandlers.draggedElement = tree;
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
    const { draggedElement, draggedElementShadow, events } = EventHandlers;
    if (draggedElement && events.indicator && !events.indicator.error) {
      const { placement } = events.indicator;
      onDropNode(draggedElement, placement);
    }

    if (draggedElementShadow) {
      draggedElementShadow.parentNode.removeChild(draggedElementShadow);
      EventHandlers.draggedElementShadow = null;
    }

    EventHandlers.draggedElement = null;
    EventHandlers.events.indicator = null;

    this.store.actions.setIndicator(null);
    this.store.actions.setNodeEvent('dragged', null);
  }

  /**
   * Create a new instance of Handlers with reference to the current EventHandlers
   * @param type A class that extends DerivedEventHandlers
   * @param args Additional arguments to pass to the constructor
   */
  derive<T extends DerivedEventHandlers<any>, U extends any[]>(
    type: {
      new (store: EditorStore, derived: EventHandlers, ...args: U): T;
    },
    ...args: U
  ): T {
    return new type(this.store, this, ...args);
  }
}

/**
 *  Allows for external packages to easily extend EventHandlers
 */
export abstract class DerivedEventHandlers<T extends string> extends Handlers<
  T
> {
  derived: EventHandlers;

  protected constructor(store: EditorStore, derived: EventHandlers) {
    super(store);
    this.derived = derived;
  }
}

export type EventConnectors = ConnectorsForHandlers<EventHandlers>;
