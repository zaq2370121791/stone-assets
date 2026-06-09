(function () {
  'use strict';

  const TAG_ATTR = 'data-ystone-float-root';
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

  const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

  const state = {
    root: null,
    observer: null,
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

  function mountParent() {
    return document.documentElement || document.body;
  }

  function repairFetch() {
    if (nativeFetch && typeof window.fetch !== 'function') {
      window.fetch = nativeFetch;
    }
  }

  function forceRootStyle(node) {
    node.style.cssText = `${node.style.cssText || ''}; ${ROOT_STYLE}`;
  }

  function rememberRoot(node) {
    if (!isYstoneOverlayHost(node)) return;

    node.setAttribute(TAG_ATTR, 'true');
    forceRootStyle(node);
    state.root = node;
    ensureRootMounted();
  }

  function ensureRootMounted() {
    repairFetch();

    const parent = mountParent();
    const root = state.root || document.querySelector(`[${TAG_ATTR}="true"]`);
    if (!parent || !root) return;

    state.root = root;
    forceRootStyle(root);

    if (root.parentNode !== parent) {
      parent.appendChild(root);
    }
  }

  function scanAddedNodes(nodes) {
    nodes.forEach((node) => {
      if (isYstoneOverlayHost(node)) {
        rememberRoot(node);
      }
    });
  }

  function startKeeper() {
    const parent = mountParent();
    if (!parent || state.observer) return;

    state.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => scanAddedNodes(mutation.addedNodes));
      ensureRootMounted();
    });

    state.observer.observe(parent, {
      childList: true,
      subtree: true,
    });

    scanAddedNodes(parent.childNodes);
    repairFetch();
    ensureRootMounted();
    setInterval(ensureRootMounted, 500);
  }

  if (document.documentElement || document.body) {
    startKeeper();
  } else {
    document.addEventListener('DOMContentLoaded', startKeeper, { once: true });
  }
})();
