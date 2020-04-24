import { Patch, applyPatches } from "immer";

type Timeline = Array<{
  patches: Patch[];
  inversePatches: Patch[];
}>;

export class History {
  timeline: Timeline = [];
  pointer = -1;
  lastChange;

  add(patches, inversePatches) {
    if (patches.length == 0 && inversePatches.length == 0) return;

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
