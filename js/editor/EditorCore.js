import { CameraController } from "./CameraController.js";
import { HistoryManager } from "./HistoryManager.js";

export class EditorCore {
  constructor({
    canvas,
    initialDocument,
    renderer = null,
    onDocumentChange = () => {},
    onCameraChange = () => {},
    onHistoryChange = () => {},
    enableHistoryShortcuts = false
  }) {
    if (!(canvas instanceof Element)) {
      throw new TypeError("EditorCore: canvas要素が必要です。");
    }

    this.canvas = canvas;
    this.renderer = renderer;
    this.onDocumentChange = onDocumentChange;
    this.enableHistoryShortcuts = enableHistoryShortcuts;

    this.document = structuredClone(initialDocument ?? {
      version: 1,
      weaponType: "oneHandedSword",
      activePartId: "blade",
      parts: []
    });

    this.camera = new CameraController({
      onChange: (transform) => {
        onCameraChange(transform);
        this.requestRender();
      }
    });

    this.history = new HistoryManager({
      limit: 200,
      onChange: onHistoryChange
    });

    this.running = false;
    this.renderRequested = true;
    this.frameId = null;
    this.boundLoop = this.loop.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  initialize() {
    if (this.running) return;

    this.camera.initialize(this.canvas);
    this.history.initialize(this.document);
    if(this.enableHistoryShortcuts){window.addEventListener("keydown", this.boundKeyDown);}

    this.running = true;
    this.frameId = requestAnimationFrame(this.boundLoop);
  }

  destroy() {
    this.running = false;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.camera.destroy();
    window.removeEventListener("keydown", this.boundKeyDown);
  }

  loop() {
    if (!this.running) return;

    if (this.renderRequested) {
      this.render();
      this.renderRequested = false;
    }

    this.frameId = requestAnimationFrame(this.boundLoop);
  }

  render() {
    if (!this.renderer) return;

    this.renderer.render({
      canvas: this.canvas,
      document: this.document,
      camera: this.camera.getTransform()
    });
  }

  requestRender() {
    this.renderRequested = true;
  }

  getDocument() {
    return structuredClone(this.document);
  }

  setDocument(nextDocument, { addToHistory = true, reason = "document-change" } = {}) {
    const next = structuredClone(nextDocument);

    if (addToHistory) this.history.commit(next);
    else this.history.replaceCurrent(next);

    this.document = next;
    this.onDocumentChange({ document: this.getDocument(), reason });
    this.requestRender();
  }

  mutate(mutator, { addToHistory = true, reason = "mutation" } = {}) {
    if (typeof mutator !== "function") {
      throw new TypeError("EditorCore.mutate: 関数が必要です。");
    }

    const draft = this.getDocument();
    mutator(draft);
    this.setDocument(draft, { addToHistory, reason });
  }

  setActivePart(partId) {
    this.mutate((draft) => {
      draft.activePartId = partId;
    }, { reason: "active-part-change" });
  }

  addPart(part) {
    this.mutate((draft) => {
      draft.parts ??= [];
      draft.parts.push(structuredClone(part));
    }, { reason: "part-add" });
  }

  updatePart(partId, updater) {
    this.mutate((draft) => {
      const part = draft.parts?.find((item) => item.id === partId);
      if (!part) throw new Error(`EditorCore: パーツ ${partId} が見つかりません。`);
      updater(part);
    }, { reason: "part-update" });
  }

  removePart(partId) {
    this.mutate((draft) => {
      draft.parts = (draft.parts ?? []).filter((part) => part.id !== partId);
      if (draft.activePartId === partId) {
        draft.activePartId = draft.parts[0]?.id ?? null;
      }
    }, { reason: "part-remove" });
  }

  undo() {
    const previous = this.history.undo();
    if (previous === null) return false;

    this.document = previous;
    this.onDocumentChange({ document: this.getDocument(), reason: "undo" });
    this.requestRender();
    return true;
  }

  redo() {
    const next = this.history.redo();
    if (next === null) return false;

    this.document = next;
    this.onDocumentChange({ document: this.getDocument(), reason: "redo" });
    this.requestRender();
    return true;
  }

  handleKeyDown(event) {
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.code === "KeyZ" && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }

    if (
      (modifier && event.code === "KeyY") ||
      (modifier && event.shiftKey && event.code === "KeyZ")
    ) {
      event.preventDefault();
      this.redo();
    }
  }
}
