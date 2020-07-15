import React, { useEffect, useRef } from 'react';
import { useInternalEditor } from '../editor/useInternalEditor';
import { RenderIndicator, getDOMInfo } from '@candulabs/craft-utils';
import movePlaceholder from './movePlaceholder';
import { EventHandlerContext } from './EventContext';

export const Events: React.FC = ({ children }) => {
  const {
    events,
    actions,
    indicator,
    store,
    handlers,
    handlersFactory,
  } = useInternalEditor((state) => ({
    events: state.events,
    indicator: state.options.indicator,
    handlers: state.handlers,
    handlersFactory: state.options.handlers,
  }));

  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    // TODO: Let's use setState for all internal actions
    actions.setState(
      (state) => (state.handlers = handlersFactory(storeRef.current))
    );
  }, [actions, handlersFactory]);

  return handlers ? (
    <EventHandlerContext.Provider value={handlers}>
      {events.indicator &&
        React.createElement(RenderIndicator, {
          style: {
            ...movePlaceholder(
              events.indicator.placement,
              getDOMInfo(events.indicator.placement.parent.dom),
              events.indicator.placement.currentNode &&
                getDOMInfo(events.indicator.placement.currentNode.dom)
            ),
            backgroundColor: events.indicator.error
              ? indicator.error
              : indicator.success,
            transition: '0.2s ease-in',
          },
        })}
      {children}
    </EventHandlerContext.Provider>
  ) : null;
};
