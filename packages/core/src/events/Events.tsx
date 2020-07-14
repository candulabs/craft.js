import React, { useMemo, useRef } from 'react';
import { useInternalEditor } from '../editor/useInternalEditor';
import { RenderIndicator, getDOMInfo } from '@candulabs/craft-utils';
import movePlaceholder from './movePlaceholder';
import { EventHandlerContext } from './EventContext';

export const Events: React.FC = ({ children }) => {
  const { events, indicator, store, handlers } = useInternalEditor((state) => ({
    events: state.events,
    indicator: state.options.indicator,
    handlers: state.options.handlers,
  }));

  const storeRef = useRef(store);
  storeRef.current = store;

  const handler = useMemo(() => handlers(storeRef.current), [handlers]);

  return (
    <EventHandlerContext.Provider value={handler}>
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
  );
};
