export class HistoryManager {
  constructor({ limit = 200, clone = (value) => structuredClone(value), onChange = () => {} } = {}) {
    this.limit = Math.max(1, Number(limit) || 200);
    this.clone = clone;
    this.onChange = onChange;
    this.undoStack = [];
    this.redoStack = [];
    this.current = null;
  }

  initialize(initialState) {
    this.clear();
    this.current = this.clone(initialState);
    this.emitChange();
  }

  commit(nextState, { force = false } = {}) {
    const next = this.clone(nextState);

    if (!force && this.current !== null && this.isEqual(this.current, next)) {
      return false;
    }

    if (this.current !== null) {
      this.undoStack.push(this.clone(this.current));
      if (this.undoStack.length > this.limit) this.undoStack.shift();
    }

    this.current = next;
    this.redoStack = [];
    this.emitChange();
    return true;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.redoStack.push(this.clone(this.current));
    this.current = this.undoStack.pop();
    this.emitChange();
    return this.clone(this.current);
  }

  redo() {
    if (!this.canRedo()) return null;
    this.undoStack.push(this.clone(this.current));
    this.current = this.redoStack.pop();
    this.emitChange();
    return this.clone(this.current);
  }

  replaceCurrent(state) {
    this.current = this.clone(state);
    this.emitChange();
  }

  getCurrent() {
    return this.current === null ? null : this.clone(this.current);
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.current = null;
    this.emitChange();
  }

  getStatus() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  emitChange() {
    this.onChange(this.getStatus());
  }

  isEqual(left, right) {
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  }
}
