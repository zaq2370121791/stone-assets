(function () {
  'use strict';

  const TAG_ATTR = 'data-ystone-float-root';
  const BODY_TAG_ATTR = 'data-ystone-body-root';
  const ROOT_STYLE = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 0',
    'height: 0',
    'z-index: 2147483647',
    'pointer-events: none',
    'display: block',
    'visibility: visible',
  ].join('; ');

  const state = {
    root: null,
    bodyRoot: null,
    originalAppendChild: Node.prototype.appendChild,
  };

  function isYstoneOverlayHost(node) {
    return Boolean(
      node &&
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === 'DIV' &&
        node.getAttribute('aria-hidden') === 'true' &&
        !node.id &&
        !node.className
    );
  }

  function markRoot(node) {
    if (!isYstoneOverlayHost(node)) return;

    node.setAttribute(TAG_ATTR, 'true');
    node.style.cssText = `${node.style.cssText || ''}; ${ROOT_STYLE}`;
    state.root = node;
    state.bodyRoot = node.parentNode;
    if (state.bodyRoot && state.bodyRoot.nodeType === Node.ELEMENT_NODE) {
      state.bodyRoot.setAttribute(BODY_TAG_ATTR, 'true');
    }
  }

  function getMountParent() {
    return document.body || document.documentElement;
  }

  function ensureRootMounted() {
    const current =
      state.root || document.querySelector(`[${TAG_ATTR}="true"]`);
    if (!current) return;

    state.root = current;
    current.style.cssText = `${current.style.cssText || ''}; ${ROOT_STYLE}`;

    const parent = getMountParent();
    if (!parent || current.isConnected) return;

    state.originalAppendChild.call(parent, current);
    state.bodyRoot = parent;
    if (parent.nodeType === Node.ELEMENT_NODE) {
      parent.setAttribute(BODY_TAG_ATTR, 'true');
    }
  }

  Node.prototype.appendChild = function patchedAppendChild(node) {
    const appended = state.originalAppendChild.call(this, node);
    if (this === document.body || this === document.documentElement) {
      markRoot(appended);
    }
    return appended;
  };

  const observer = new MutationObserver(() => ensureRootMounted());

  function startKeeper() {
    const parent = getMountParent();
    if (!parent) return;

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    ensureRootMounted();
    setInterval(ensureRootMounted, 500);
  }

  if (document.documentElement) {
    startKeeper();
  } else {
    document.addEventListener('DOMContentLoaded', startKeeper, { once: true });
  }
})();
