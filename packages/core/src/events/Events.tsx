import React, { useEffect, useRef } from 'react';
import { useInternalEditor } from '../editor/useInternalEditor';
import { RenderIndicator, getDOMInfo } from '@candulabs/craft-utils';
import movePlaceholder from './movePlaceholder';
import { EventHandlerContext } from './EventContext';

export const Events: React.FC = ({ children }) => {
  const {
    actions,
    indicator,
    indicatorOptions,
    store,
    handlers,
    handlersFactory,
  } = useInternalEditor((state) => ({
    indicator: state.indicator,
    indicatorOptions: state.options.indicator,
    handlers: state.handlers,
    handlersFactory: state.options.handlers,
  }));

  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    // TODO: Let's use setState for all internal actions
    actions.history
      .ignore()
      .setState(
        (state) => (state.handlers = handlersFactory(storeRef.current))
      );
  }, [actions, handlersFactory]);

  return handlers ? (
    <EventHandlerContext.Provider value={handlers}>
      {indicator &&
        React.createElement(RenderIndicator, {
          style: {
            ...movePlaceholder(
              indicator.placement,
              getDOMInfo(indicator.placement.parent.dom),
              indicator.placement.currentNode &&
                getDOMInfo(indicator.placement.currentNode.dom)
            ),
            backgroundColor: indicator.error
              ? indicatorOptions.error
              : indicatorOptions.success,
            transition: '0.2s ease-in',
          },
        })}
      {children}
    </EventHandlerContext.Provider>
  ) : null;
};
