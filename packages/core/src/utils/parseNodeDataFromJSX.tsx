import React, { Fragment } from "react";
import { Canvas } from "../nodes/Canvas";
import { NodeId, NodeData } from "../interfaces";
import { createNode } from "./createNode";
const shortid = require("shortid");

const getReactElement = (elem) => {
  if (typeof elem === "string") {
    return React.createElement(elem);
  }
  return elem;
};

export const parseNodeDataFromJSX = (
  elem: React.ReactElement | string,
  data: Partial<NodeData> = {}
): Partial<NodeData> => {
  const { type, props } = getReactElement(elem);

  return {
    ...data,
    type,
    props: {
      ...props,
      ...(data.props || {}),
    },
  };
};
