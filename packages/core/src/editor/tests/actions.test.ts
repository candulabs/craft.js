import cloneDeep from 'lodash/cloneDeep';
import mapValues from 'lodash/mapValues';
import * as actions from '../actions';
import { produce } from 'immer';
import { QueryMethods } from '../../editor/query';
import { EditorState } from '@candulabs/craft-core';
import { createNode } from '../../utils/createNode';
import {
  createTestState,
  createTestNodes,
  expectEditorState,
} from '../../utils/testHelpers';

const Actions = (state) => (cb) =>
  produce<EditorState>(state, (draft) =>
    cb(actions.Actions(draft as any, QueryMethods(state) as any))
  );

const rootNode = createNode({
  id: 'ROOT',
  data: {
    type: 'div',
  },
});

const leafNode = createNode({
  id: 'node-leaf',
  data: {
    type: 'span',
  },
});

const primaryButton = createNode({
  id: 'primary-button',
  data: {
    type: 'button',
  },
});

const secondaryButton = createNode({
  id: 'secondary-button',
  data: {
    type: 'button',
  },
});

const rootTestNode = (config: any = {}) => {
  return {
    id: rootNode.id,
    ...config,
    data: {
      type: 'div',
      ...(config.data || {}),
    },
  };
};

describe('actions.add', () => {
  let state = createTestState({
    nodes: rootTestNode(),
  });
  it('should throw if we give a parentId that doesnt exist', () => {
    expect(() =>
      Actions(createTestState())((actions) => actions.add(leafNode))
    ).toThrow();
  });
  it('should throw if we create a node that doesnt have a parent and we dont provide a parent ', () => {
    expect(() =>
      Actions(emptyState)((actions) => actions.add(rootNode, rootNode.id))
    ).toThrow();
  });
  it('should be able to add leaf to the document', () => {
    const newState = Actions(state)((actions) =>
      actions.add(leafNode, rootNode.id)
    );

    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode({
          data: {
            type: 'div',
            nodes: [leafNode],
          },
        }),
      })
    );
  });
  it('should be able to add two nodes', () => {
    const newState = Actions(state)((actions) =>
      actions.add([primaryButton, secondaryButton], rootNode.id)
    );

    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode({
          data: {
            type: 'div',
            nodes: [primaryButton, secondaryButton],
          },
        }),
      })
    );
  });
  it('should be able to add the node at 0', () => {
    const newState = Actions(state)((actions) =>
      actions.add(leafNode, rootNode.id, 0)
    );
    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode({
          data: {
            type: 'div',
            nodes: [leafNode],
          },
        }),
      })
    );
  });
});

describe('actions.addNodeTree', () => {
  let state;

  beforeEach(() => {
    state = createTestState({
      nodes: rootTestNode({
        data: {
          type: 'div',
        },
      }),
    });
  });

  it('should be able to add a single node at 0', () => {
    const newState = Actions(state)((actions) =>
      actions.addNodeTree(
        {
          rootNodeId: leafNode.id,
          nodes: { [leafNode.id]: leafNode },
        },
        rootNode.id
      )
    );
    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode({
          data: {
            type: 'div',
            nodes: [leafNode],
          },
        }),
      })
    );
  });
  it('should be able to add a larger tree', () => {
    const card = {
      id: 'card',
      data: {
        type: 'section',
        nodes: [
          {
            id: 'card-child',
            data: {
              type: 'h1',
            },
          },
        ],
      },
    };

    const newState = Actions(state)((actions) =>
      actions.addNodeTree(
        {
          rootNodeId: 'card',
          nodes: createTestNodes(card),
        },
        rootNode.id
      )
    );

    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode({
          data: {
            type: 'div',
            nodes: [card],
          },
        }),
      })
    );
  });
});

describe('actions.delete', () => {
  let state;

  beforeEach(() => {
    state = createTestState({
      nodes: rootTestNode(),
    });
  });

  // it('should throw if you try to a non existing node', () => {
  //   expect(() => Actions(emptyState)((actions) => actions.delete(leafNode.id))).toThrow();
  // });
  // it('should throw if you try to delete the root', () => {
  //   expect(() => Actions(documentState)((actions) => actions.add(rootNode.id))).toThrow();
  // });
  it('should be able to delete node', () => {
    const state = createTestState({
      nodes: rootTestNode({
        data: {
          type: 'div',
          nodes: [leafNode],
        },
      }),
    });

    const newState = Actions(state)((actions) => actions.delete(leafNode.id));

    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode(),
      })
    );
  });
  it('should be able to delete nodes with children', () => {
    const card = {
      id: 'card',
      data: {
        type: 'div',
        nodes: [
          {
            id: 'card-child',
            data: {
              type: 'h1',
            },
          },
        ],
      },
    };

    const state = createTestState({
      nodes: rootTestNode({
        data: {
          type: 'div',
          nodes: [card],
        },
      }),
    });

    const newState = Actions(state)((actions) => actions.delete(card.id));

    expectEditorState(
      newState,
      createTestState({
        nodes: rootTestNode(),
      })
    );
  });
});

describe('actions.clearEvents', () => {
  it('should be able to reset the events', () => {
    const nodes = {
      id: 'node-a',
      data: {
        type: 'div',
        nodes: [
          {
            id: 'node-b',
            data: {
              type: 'span',
            },
          },
        ],
      },
    };

    const state = createTestState({
      nodes,
      events: {
        selected: new Set(['node-a']),
        hovered: new Set(['node-b']),
      },
    });

    const newState = Actions(state)((actions) => actions.clearEvents());

    expectEditorState(
      newState,
      createTestState({
        nodes,
      })
    );
  });
});

describe('actions.replaceNodes', () => {
  it('should be able to replace the nodes', () => {
    const newNodes = {
      id: 'Test',
      data: {
        type: 'div',
        nodes: [
          {
            id: 'node-btn',
            data: {
              type: 'button',
            },
          },
        ],
      },
    };

    const newState = Actions(createTestState())((actions) =>
      actions.replaceNodes(createTestNodes(newNodes))
    );

    expectEditorState(newState, createTestState({ nodes: newNodes }));
  });
});

describe('actions.reset', () => {
  it('should reset the entire state', () => {
    const state = createTestState({
      nodes: {
        id: 'node',
        data: {
          type: 'div',
          linkedNodes: {
            header: {
              id: 'node-header',
              data: {
                type: 'section',
              },
            },
          },
        },
      },
      events: {
        selected: new Set(['node-header']),
      },
    });

    const newState = Actions(state)((actions) => actions.reset());

    expectEditorState(newState, createTestState());
  });
});

describe('actions.deserialize', () => {
  it('should be able to set the state correctly', () => {
    const nodes = {
      id: 'node-root',
      data: {
        type: 'h1',
        nodes: [
          {
            id: 'btn',
            data: {
              type: 'button',
            },
          },
          {
            id: 'container',
            data: {
              type: 'div',
              linkedNodes: {
                header: {
                  id: 'header',
                  data: {
                    type: 'div',
                  },
                },
              },
            },
          },
        ],
      },
    };

    const serialized = mapValues(createTestNodes(nodes), ({ data }) => ({
      ...data,
    }));

    const newState = Actions(createTestState())((actions) =>
      actions.deserialize(serialized)
    );

    expectEditorState(
      newState,
      createTestState({
        nodes,
      })
    );
  });
});

describe('actions.move', () => {
  let state;
  beforeEach(() => {
    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          isCanvas: true,
          nodes: [
            {
              id: 'node-a',
              data: {
                type: 'button',
              },
            },
            {
              id: 'node-b',
              data: {
                type: 'div',
                isCanvas: true,
                nodes: [
                  {
                    id: 'node-c',
                    data: {
                      type: 'button',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });
  it('should be able to move node', () => {
    const newState = Actions(state)((actions) =>
      actions.move('node-c', 'root', 2)
    );

    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            isCanvas: true,
            nodes: [
              {
                id: 'node-a',
                data: {
                  type: 'button',
                },
              },
              {
                id: 'node-b',
                data: {
                  type: 'div',
                  isCanvas: true,
                },
              },
              {
                id: 'node-c',
                data: {
                  type: 'button',
                },
              },
            ],
          },
        },
      })
    );
  });
});

describe('actions.setOptions', () => {
  it('should be able to change options state', () => {
    const state = createTestState();
    const newState = Actions(state)((actions) =>
      actions.setOptions((options) => {
        options.enabled = false;
      })
    );

    expectEditorState(
      newState,
      createTestState({
        options: {
          ...state.options,
          enabled: false,
        },
      })
    );
  });
});

describe('actions.setNodeEvent', () => {
  let state, nodeA, nodeB;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
      },
    };

    nodeB = {
      id: 'node-b',
      data: {
        type: 'button',
      },
    };

    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          nodes: [nodeA, nodeB],
        },
      },
    });
  });

  it('should be able to change events state', () => {
    const newState = Actions(state)((actions) =>
      actions.setNodeEvent('selected', ['node-a', 'node-b'])
    );

    nodeA.events = {
      selected: true,
    };
    nodeB.events = {
      selected: true,
    };
    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            nodes: [nodeA, nodeB],
          },
        },
        events: {
          selected: new Set(['node-a', 'node-b']),
        },
      })
    );
  });
});

describe('actions.setProp', () => {
  let state, nodeA;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
        props: {
          color: '#fff',
        },
      },
    };

    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          nodes: [nodeA],
        },
      },
    });
  });

  it('should update props', () => {
    const newState = Actions(state)((actions) =>
      actions.setProp('node-a', (props) => (props.color = '#000'))
    );

    nodeA.data.props.color = '#000';

    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            nodes: [nodeA],
          },
        },
      })
    );
  });
});

describe('actions.setCustom', () => {
  let state, nodeA;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
        custom: {
          css: {
            color: '#fff',
          },
        },
      },
    };

    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          nodes: [nodeA],
        },
      },
    });
  });

  it('should update custom properties', () => {
    const newState = Actions(state)((actions) =>
      actions.setCustom('node-a', (custom) => (custom.css.color = '#000'))
    );

    nodeA.data.custom.css.color = '#000';

    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            nodes: [nodeA],
          },
        },
      })
    );
  });
});

describe('actions.setHidden', () => {
  let state, nodeA;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
      },
    };

    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          nodes: [nodeA],
        },
      },
    });
  });

  it('should hide node', () => {
    const newState = Actions(state)((actions) =>
      actions.setHidden('node-a', true)
    );

    nodeA.data.hidden = true;

    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            nodes: [nodeA],
          },
        },
      })
    );
  });
});

describe('actions.setDOM', () => {
  let state, nodeA;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
      },
    };

    state = createTestState({
      nodes: {
        id: 'root',
        data: {
          type: 'div',
          nodes: [nodeA],
        },
      },
    });
  });

  it('should set DOM', () => {
    const dom = document.createElement('button');

    const newState = Actions(state)((actions) => actions.setDOM('node-a', dom));

    nodeA.dom = dom;

    expectEditorState(
      newState,
      createTestState({
        nodes: {
          id: 'root',
          data: {
            type: 'div',
            nodes: [nodeA],
          },
        },
      })
    );
  });
});

describe('actions.setIndicator', () => {
  let state, root, nodeA;
  beforeEach(() => {
    nodeA = {
      id: 'node-a',
      data: {
        type: 'button',
      },
      dom: document.createElement('button'),
    };

    root = {
      id: 'root',
      dom: document.createElement('div'),
      data: {
        type: 'div',
        nodes: [nodeA],
      },
    };

    state = createTestState({
      nodes: root,
    });
  });

  it('should set indicator', () => {
    const indicator = {
      placement: {
        currentNode: nodeA,
        parent: root,
        index: 0,
        where: 'after',
      },
    };

    const newState = Actions(state)((actions) =>
      actions.setIndicator(indicator)
    );

    expectEditorState(
      newState,
      createTestState({
        nodes: root,
        indicator,
      })
    );
  });
});
