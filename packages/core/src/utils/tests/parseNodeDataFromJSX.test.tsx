import React from "react";
import { parseNodeDataFromJSX } from "../parseNodeDataFromJSX";

describe("parseNodeDataFromJSX", () => {
  const props = { href: "href" };

  it("should transform a div correctly", () => {
    expect(parseNodeDataFromJSX("div")).toEqual({ type: "div", props: {} });
  });
  it("should transform a custom node correctly", () => {
    expect(parseNodeDataFromJSX(<a {...props} />)).toEqual({
      type: "a",
      props,
    });
  });
  it("should incorporate extra data correctly", () => {
    const extraData = { props: { style: "purple" } };
    expect(parseNodeDataFromJSX(<button {...props} />, extraData)).toEqual({
      type: "button",
      props: {
        ...props,
        ...extraData.props,
      },
    });
  });
});
