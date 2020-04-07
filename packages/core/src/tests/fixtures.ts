/**
 * Nodes
 */
export const rootNode = {
  id: "canvas-ROOT",
  data: {
    props: {},
    name: "Document",
    displayName: "Document",
    custom: {},
  },
  related: {},
  events: { selected: false, dragged: false, hovered: false },
  rules: {},
};

export const leafNode = {
  id: "node-L1eGyOJ4m",
  data: {
    props: { childrenString: "Header 1" },
    name: "Text",
    displayName: "Text",
    custom: {},
  },
  related: {},
  events: { selected: false, dragged: false, hovered: false },
  rules: {},
};

/**
 * Editor states
 */
export const emptyState = {
  nodes: {},
  events: {
    dragged: null,
    selected: null,
    hovered: null,
    indicator: null,
  },
};

export const documentState = {
  ...emptyState,
  nodes: {
    [rootNode.id]: rootNode,
  },
};

export const documentWithLeafState = {
  ...emptyState,
  nodes: {
    [rootNode.id]: {
      ...rootNode,
      data: { ...rootNode.data, nodes: [leafNode.id] },
    },
    [leafNode.id]: {
      ...leafNode,
      data: { ...leafNode.data, parent: rootNode.id },
    },
  },
};
