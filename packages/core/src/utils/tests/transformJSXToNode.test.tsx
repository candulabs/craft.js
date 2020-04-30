import React from "react";
import { transformJSXToNode } from "../transformJSXToNode";

describe("transformJSXToNode", () => {
  const props = { href: "href" };

  it("should transform a div correctly", () => {
    expect(transformJSXToNode("div")).toEqual({ type: "div", props: {} });
  });
  it("should transform a custom node correctly", () => {
    expect(transformJSXToNode(<a {...props} />)).toEqual({ type: "a", props });
  });
  it("should incorporate extra data correctly", () => {
    const extraData = { props: { style: "purple" } };
    expect(transformJSXToNode(<button {...props} />, extraData)).toEqual({
      type: "button",
      props: {
        ...props,
        ...extraData.props,
      },
    });
  });
});
