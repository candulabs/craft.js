export const createShadow = (e: DragEvent, dom?: HTMLElement) => {
  const domToRender = (dom || e.target) as HTMLElement;

  if (!domToRender) {
    return;
  }

  const shadow = domToRender.cloneNode(true) as HTMLElement;
  const { width, height } = domToRender.getBoundingClientRect();
  shadow.style.width = `${width}px`;
  shadow.style.height = `${height}px`;
  shadow.style.position = "fixed";
  shadow.style.left = "-100%";
  shadow.style.top = "-100%";

  document.body.appendChild(shadow);
  e.dataTransfer.setDragImage(shadow, 0, 0);

  return shadow;
};
