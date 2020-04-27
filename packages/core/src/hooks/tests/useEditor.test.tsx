import React from "react";
import { useEditor } from "../useEditor";

import { useInternalEditor } from "../../editor/useInternalEditor";

jest.mock("../../editor/useInternalEditor");
const internalEditorMock = useInternalEditor as jest.Mock<any>;

describe("useEditor", () => {
  const otherActions = {
    one: "one",
    runWithoutHistory: {
      replaceNodes: "replaceNodes",
      reset: "reset",
      replaceEvents: "replaceEvents",
      actions: "actions",
    },
  };
  const actions = {
    setDOM: "setDOM",
    setNodeEvent: "setNodeEvent",
    replaceNodes: "replaceNodes",
    reset: "reset",
    ...otherActions,
  };
  const otherQueries = { another: "query" };
  const query = { deserialize: "deserialize", ...otherQueries };
  const state = {
    aRandomValue: "aRandomValue",
    connectors: "one",
    actions,
    query,
    store: {},
  };
  let collect;
  let editor;

  beforeEach(() => {
    React.useMemo = (f) => f();

    internalEditorMock.mockImplementation(() => state);
    collect = jest.fn();
    editor = useEditor(collect);
  });
  it("should have called internal state with collect", () => {
    expect(useInternalEditor).toHaveBeenCalledWith(collect);
  });
  it("should return the correct editor", () => {
    // useEditor will remove replaceNodes, reset, replaceEvents
    const {
      replaceNodes,
      reset,
      replaceEvents,
      ...runWithoutHistory
    } = otherActions.runWithoutHistory;

    expect(editor).toEqual(
      expect.objectContaining({
        actions: {
          ...otherActions,
          runWithoutHistory,
          selectNode: expect.any(Function),
        },
        connectors: state.connectors,
        query: otherQueries,
        aRandomValue: state.aRandomValue,
      })
    );
  });
});
