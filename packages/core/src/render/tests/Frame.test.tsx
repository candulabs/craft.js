import React from "react";
import { shallow } from "enzyme";
import { act } from "react-dom/test-utils";

import { useInternalEditor } from "../../editor/useInternalEditor";
import { Frame } from "../Frame";

jest.mock("../../editor/useInternalEditor");
const mockEditor = useInternalEditor as jest.Mock<any>;

describe("<Frame />", () => {
  const children = <h1>a children</h1>;
  const json = "{}";
  let actions;
  let component;
  let query;
  let setRender;

  beforeEach(() => {
    setRender = jest.fn();
    React.useEffect = f => f();
    // @ts-ignore
    React.useState = () => [null, setRender];
    actions = { replaceNodes: jest.fn(), deserialize: jest.fn() };
    query = { createNode: jest.fn() };
    mockEditor.mockImplementation(() => ({ actions, query }));
  });
  describe("When rendering a Frame with no Children and no Data", () => {
    it("should throw an error if there is no data", () => {
      expect(() => shallow(<Frame />)).toThrow();
    });
    it("should throw an error if the children is not a canvas", () => {
      expect(() => shallow(<Frame>{children}</Frame>)).toThrow();
    });
  });

  describe("When rendering using `json`", () => {
    beforeEach(() => {
      component = <Frame json={json} />;
    });
    it("should be of type null", () => {
      expect(component.type).toBe(null);
    });
    it("should deserialize the json", () => {
      expect(actions.deserialize).toHaveBeenCalledWith(json);
    });
    it("should call setRender", () => {
      expect(setRender).toHaveBeenCalled();
    });
  });

  /*
    *

    query = { serialize: jest.fn().mockImplementation(() => "{}") };
    onNodesChange = jest.fn();
    mockEditor.mockImplementation(value => ({ ...value, query, actions }));
    act(() => {
      component = shallow(
        <Frame onNodesChange={onNodesChange}>{children}</Frame>
      );
    });
  });
  it("should render the children with events", () => {
    expect(component.contains(<Events>{children}</Events>)).toBe(true);
  });
  it("should render the EditorContext.Provider", () => {
    expect(component.find(EditorContext.Provider)).toHaveLength(1);
  });
  it("should have called serialize", () => {
    expect(query.serialize).toHaveBeenCalled();
  });
  xit("should call onNodesChange if there is a json", () => {
    expect(onNodesChange).toHaveBeenCalledWith({});
  });
   */
});
