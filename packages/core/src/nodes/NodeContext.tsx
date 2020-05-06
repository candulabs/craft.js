import React, { useMemo } from "react";
import { NodeId } from "../interfaces";
import { NodeConnectors, NodeHandlers } from "./NodeHandlers";
import { useEventHandler } from "../events";

export const NodeContext = React.createContext<any>(null);

export type NodeProvider = {
  id: NodeId;
  related?: boolean;
  connectors?: NodeConnectors;
};

export const NodeProvider: React.FC<NodeProvider> = ({
  id,
  related = false,
  children,
}) => {
  const handlers = useEventHandler();
  const connectors = useMemo(
    () => handlers.derive(NodeHandlers, id).connectors(),
    [handlers, id]
  );

  return (
    <NodeContext.Provider value={{ id, related, connectors }}>
      {children}
    </NodeContext.Provider>
  );
};
