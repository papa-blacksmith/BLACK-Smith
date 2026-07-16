export class CameraController {
  constructor({ minZoom = 0.25, maxZoom = 6, zoomStep = 1.12, onChange = () => {} } = {}) {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.zoomStep = zoomStep;
    this.onChange = onChange;
    this.canvas = null;
    this.isPanning = false;
    this.spacePressed = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.boundWheel = this.handleWheel.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  initialize(canvas) {
    if (!(canvas instanceof Element)) {
      throw new TypeError("CameraController: 有効なキャンバス要素が必要です。");
    }

    this.destroy();
    this.canvas = canvas;

    canvas.addEventListener("wheel", this.boundWheel, { passive: false });
    canvas.addEventListener("pointerdown", this.boundPointerDown);
    canvas.addEventListener("contextmenu", this.boundContextMenu);
    window.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerup", this.boundPointerUp);
    window.addEventListener("pointercancel", this.boundPointerUp);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener("wheel", this.boundWheel);
      this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
      this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
    }

    window.removeEventListener("pointermove", this.boundPointerMove);
    window.removeEventListener("pointerup", this.boundPointerUp);
    window.removeEventListener("pointercancel", this.boundPointerUp);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);

    this.canvas = null;
    this.isPanning = false;
  }

  handleWheel(event) {
    if (!this.canvas) return;
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const before = this.screenToWorld(screenX, screenY);

    const factor = event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
    this.zoom = this.clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    this.x = screenX - before.x * this.zoom;
    this.y = screenY - before.y * this.zoom;

    this.emitChange();
  }

  handlePointerDown(event) {
    const rightButton = event.button === 2;
    const spacePan = this.spacePressed && event.button === 0;
    if (!rightButton && !spacePan) return;

    event.preventDefault();
    this.isPanning = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas?.setPointerCapture?.(event.pointerId);
  }

  handlePointerMove(event) {
    if (!this.isPanning) return;

    this.x += event.clientX - this.lastPointerX;
    this.y += event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.emitChange();
  }

  handlePointerUp(event) {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.canvas?.releasePointerCapture?.(event.pointerId);
  }

  handleContextMenu(event) {
    event.preventDefault();
  }

  handleKeyDown(event) {
    if (event.code === "Space") this.spacePressed = true;
    if (event.code === "Home") {
      event.preventDefault();
      this.reset();
    }
  }

  handleKeyUp(event) {
    if (event.code === "Space") this.spacePressed = false;
  }

  setZoom(value, anchorX = 0, anchorY = 0) {
    const before = this.screenToWorld(anchorX, anchorY);

    this.zoom = this.clamp(
      Number(value) || 1,
      this.minZoom,
      this.maxZoom
    );

    this.x = anchorX - before.x * this.zoom;
    this.y = anchorY - before.y * this.zoom;

    this.emitChange();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.emitChange();
  }

  worldToScreen(worldX, worldY) {
    return { x: worldX * this.zoom + this.x, y: worldY * this.zoom + this.y };
  }

  screenToWorld(screenX, screenY) {
    return { x: (screenX - this.x) / this.zoom, y: (screenY - this.y) / this.zoom };
  }

  getTransform() {
    return { x: this.x, y: this.y, zoom: this.zoom };
  }

  emitChange() {
    this.onChange(this.getTransform());
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}
