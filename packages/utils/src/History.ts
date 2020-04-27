import { Patch, applyPatches } from "immer";

type Timeline = Array<{
  patches: Patch[];
  inversePatches: Patch[];
}>;

export class History {
  timeline: Timeline = [];
  pointer = -1;

  add(patches: Patch[], inversePatches: Patch[]) {
    if (patches.length == 0 && inversePatches.length == 0) {
      return;
    }

    this.pointer = this.pointer + 1;
    this.timeline.length = this.pointer;
    this.timeline[this.pointer] = { patches, inversePatches };
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

    const { inversePatches } = this.timeline[this.pointer];
    this.pointer = this.pointer - 1;
    const applied = applyPatches(state, inversePatches);

    return applied;
  }

  redo(state) {
    if (!this.canRedo()) {
      return;
    }

    this.pointer = this.pointer + 1;
    const { patches } = this.timeline[this.pointer];
    const applied = applyPatches(state, patches);
    return applied;
  }
}
