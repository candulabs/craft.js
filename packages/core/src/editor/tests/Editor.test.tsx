import React from "react";
import { shallow } from "enzyme";
import { act } from "react-dom/test-utils";

import { EditorContext } from "../EditorContext";
import { Editor } from "../editor";
import { Events } from "../../events";
import { useEditorStore } from "../store";

jest.mock("../store");
const mockStore = useEditorStore as jest.Mock<any>;

describe("<Editor />", () => {
  const children = <h1>a children</h1>;
  let actions;
  let component;
  let query;
  let onNodesChange;

  beforeEach(() => {
    React.useEffect = f => f();

    query = { serialize: jest.fn().mockImplementation(() => "{}") };
    onNodesChange = jest.fn();
    mockStore.mockImplementation(value => ({ ...value, query, actions }));
    act(() => {
      component = shallow(
        <Editor onNodesChange={onNodesChange}>{children}</Editor>
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
});
