import { Nodes, NodeEvents, NodeId } from "./nodes";
import { Placement } from "./events";
import { useInternalEditor } from "../editor/useInternalEditor";
import { PatchListenerAction } from "@candulabs/craft-utils";
import { ActionMethodsWithConfig } from "../editor/store";

export type Options = {
  onRender: React.ComponentType<{ render: React.ReactElement }>;
  onStateChange: (Nodes) => any;
  resolver: Resolver;
  enabled: boolean;
  indicator: Record<"success" | "error", string>;
  normaliseNodes: (
    state: EditorState,
    previousState: EditorState,
    actionPerformed: PatchListenerAction<
      EditorState,
      typeof ActionMethodsWithConfig
    >
  ) => void;
};

export type Resolver = Record<string, string | React.ElementType>;

export interface Indicator {
  placement: Placement;
  error: string | false;
}

export type EditorEvents = Record<NodeEvents, NodeId | null> & {
  indicator: Indicator | null;
};

export type EditorState = {
  nodes: Nodes;
  events: EditorEvents;
  options: Options;
};

export type ConnectedEditor<S = null> = useInternalEditor<S>;
