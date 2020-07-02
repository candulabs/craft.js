import { Patch, applyPatches } from "immer";
import isEqualWith from "lodash.isequalwith";

type Timeline = Array<{
  patches: Patch[];
  inversePatches: Patch[];
  timestamp: number;
}>;

// const getFocus = (patches) => {
//   return patches.map(({op, path, value}) => value['1RNQoM'] && value['1RNQoM'].data.custom.runtime && value['1RNQoM'].data.custom.runtime.focus.anchor )
// }
//
// const getText = (patches) => {
//   return patches.map(({op, path, value}) => value['40Q4Y1'] && value['40Q4Y1'].data.props.childrenString )
// }

export class History {
  timeline: Timeline = [];
  pointer = -1;

  throttledInversePatch: Patch[];
  add(patches: Patch[], inversePatches: Patch[]) {
    if (patches.length == 0 && inversePatches.length == 0) {
      return;
    }

    this.pointer = this.pointer + 1;
    this.timeline.length = this.pointer;
    this.timeline[this.pointer] = {
      patches,
      inversePatches,
      timestamp: Date.now(),
    };
  }

  throttleAdd(
    patches: Patch[],
    inversePatches: Patch[],
    throttleRate: number = 1000
  ) {
    if (patches.length == 0 && inversePatches.length == 0) {
      return;
    }

    if (this.timeline.length && this.pointer >= 0) {
      const { patches: currPatches, timestamp } = this.timeline[this.pointer];

      const now = new Date();
      const diff = now.getTime() - timestamp;

      if (diff < throttleRate && currPatches.length == patches.length) {
        const isSimilar = currPatches.every((currPatch, i) => {
          const { op: currOp, path: currPath } = currPatch;
          const { op, path } = patches[i];

          return op == currOp && isEqualWith(path, currPath);
        });

        if (isSimilar) {
          if (!this.throttledInversePatch) {
            this.throttledInversePatch = inversePatches;
          }
          return;
        }
      }
    }

    this.add(patches, this.throttledInversePatch || inversePatches);
    this.throttledInversePatch = null;
  }

  canUndo() {
    return this.pointer >= 0;
  }

  canRedo() {
    return this.pointer < this.timeline.length - 1;
  }

  undo(state) {
    if (!this.canUndo()) {
      return;
    }

    this.throttledInversePatch = null;

    const { inversePatches } = this.timeline[this.pointer];
    this.pointer = this.pointer - 1;

    return applyPatches(state, inversePatches);
  }

  redo(state) {
    if (!this.canRedo()) {
      return;
    }

    this.pointer = this.pointer + 1;
    const { patches } = this.timeline[this.pointer];
    return applyPatches(state, patches);
  }
}
