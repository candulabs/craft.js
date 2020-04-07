import * as actions from "../actions";
import { produce } from "immer";
import {
  documentState,
  documentWithLeafState,
  emptyState,
  leafNode,
  rootNode,
} from "../../tests/fixtures";
import { QueryMethods } from "../../editor/query";

const Actions = (state) => (cb) =>
  produce(state, (draft) => cb(actions.Actions(draft, QueryMethods(state))));

describe("actions.add", () => {
  it("should throw if we give a parentId that doesnt exist", () => {
    expect(() => Actions(emptyState)((actions) => actions.add(leafNode)));
  });
  it("should throw if we create a node that doesnt have a parent and we dont provide a parent ", () => {
    expect(() =>
      Actions(emptyState)((actions) => actions.add(rootNode, rootNode.id))
    ).toThrow();
  });
  it("should be able to add leaft to the document", () => {
    const newState = Actions(documentState)((actions) =>
      actions.add(leafNode, rootNode.id)
    );

    expect(newState).toEqual(documentWithLeafState);
  });
});

describe("actions.replaceEvents", () => {
  const newEvents = { ...emptyState.events, dragged: rootNode.id };
  it("should be able to replace the events", () => {
    const newState = Actions(emptyState)((actions) =>
      actions.replaceEvents(newEvents)
    );

    expect(newState).toEqual({ ...emptyState, events: newEvents });
  });
});

describe("actions.replaceNodes", () => {
  it("should be able to replace the nodes", () => {
    const newState = Actions(emptyState)((actions) =>
      actions.replaceNodes(documentState.nodes)
    );

    expect(newState).toEqual(documentState);
  });
});

describe("actions.reset", () => {
  it("should reset the entire state", () => {
    const newState = Actions(documentState)((actions) => actions.reset());

    expect(newState).toEqual(emptyState);
  });
});
