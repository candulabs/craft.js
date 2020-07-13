export const createShadowMultiple = (
  e: DragEvent,
  targetDOM: HTMLElement,
  shadowsToCreate: HTMLElement[]
) => {
  const selectorDOM = e.currentTarget as HTMLElement;
  const {
    top: targetTop,
    left: targetLeft,
  } = targetDOM.getBoundingClientRect();

  if (!selectorDOM) {
    return;
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0%';
  container.style.top = `0%`;
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';

  shadowsToCreate.forEach((dom) => {
    const shadow = dom.cloneNode(true) as HTMLElement;
    const { width, height, top, left } = dom.getBoundingClientRect();
    shadow.style.position = `fixed`;
    shadow.style.width = `${width}px`;
    shadow.style.height = `${height}px`;
    shadow.style.left = `${left}px`;
    shadow.style.top = `${top}px`;

    container.appendChild(shadow);
  });

  document.body.appendChild(container);
  e.dataTransfer.setDragImage(container, targetLeft, targetTop);

  return container;
};

export const createShadow = (e: DragEvent, dom?: HTMLElement) => {
  const domToRender = (dom || e.currentTarget) as HTMLElement;

  if (!domToRender) {
    return;
  }

  const shadow = domToRender.cloneNode(true) as HTMLElement;
  const { width, height } = domToRender.getBoundingClientRect();
  shadow.style.width = `${width}px`;
  shadow.style.height = `${height}px`;
  shadow.style.position = 'fixed';
  shadow.style.left = '-100%';
  shadow.style.top = '-100%';

  document.body.appendChild(shadow);
  e.dataTransfer.setDragImage(shadow, 0, 0);

  return shadow;
};
