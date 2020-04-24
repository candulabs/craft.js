import { Patch, applyPatches } from "immer";
import isEqualWith from "lodash.isequalwith";

type Timeline = Array<{
  patches: Patch[];
  inversePatches: Patch[];
}>;

export class History {
  timeline: Timeline = [];
  pointer = -1;
  lastChange;

  add(patches, inversePatches, action) {
    if (patches.length == 0 && inversePatches.length == 0) return;

    if (this.canUndo()) {
      const { patches: currPatches } = this.timeline[this.pointer];

      const now = new Date();
      const diff = (now.getTime() - this.lastChange.getTime()) / 1000;

      // Ignore similar changes that occurs within 2 seconds
      if (diff < 2 && currPatches.length == patches.length) {
        const isSimilar = currPatches.every((currPatch, i) => {
          const { op: currOp, path: currPath } = currPatch;
          const { op, path } = patches[i];

          if (op == currOp && isEqualWith(path, currPath)) return true;
          return false;
        });

        if (isSimilar) {
          return;
        }
      }
    }

    this.pointer = this.pointer + 1;
    this.timeline.length = this.pointer;
    this.timeline[this.pointer] = { patches, inversePatches };

    this.lastChange = new Date();
  }

  canUndo() {
    return this.pointer >= 0;
  }

  canRedo() {
    return this.pointer != this.timeline.length - 1;
  }

  undo(state) {
    if (this.canUndo()) {
      const { inversePatches } = this.timeline[this.pointer];
      this.pointer = this.pointer - 1;
      const applied = applyPatches(state, inversePatches);
      return applied;
    }
  }

  redo(state) {
    if (this.canRedo()) {
      this.pointer = this.pointer + 1;
      const { patches } = this.timeline[this.pointer];
      const applied = applyPatches(state, patches);
      return applied;
    }
  }
}
