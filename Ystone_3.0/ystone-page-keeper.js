(function () {
  'use strict';

  const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
  const KEEP_ATTR = 'data-ystone-page-ui-root';
  const KEEP_IDS = new Set([
    'crazy-stone-helper-ui-final',
    'crazy-stone-skin-modifier',
    'ghost-speed-panel-v3',
    'ghost-radar-handle',
    '_lootIndicator',
  ]);
  const kept = new Map();

  function cssEscape(value) {
    if (window.CSS && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function mountParent() {
    return document.documentElement || document.body;
  }

  function repairFetch() {
    if (nativeFetch && typeof window.fetch !== 'function') {
      window.fetch = nativeFetch;
    }
  }

  function isElement(node) {
    return node && node.nodeType === Node.ELEMENT_NODE;
  }

  function hasKnownMarker(node) {
    return Boolean(isElement(node) && KEEP_IDS.has(node.id));
  }

  function rootKey(node) {
    return node.id || '';
  }

  function forceKeepStyle(node) {
    const zIndex = Number.parseInt(node.style.zIndex || '0', 10);
    if (!Number.isFinite(zIndex) || zIndex < 999999) {
      node.style.zIndex = '2147483646';
    }
    if (!node.style.position) {
      node.style.position = 'fixed';
    }
    node.style.display = node.style.display === 'none' ? 'block' : node.style.display;
    node.style.visibility = 'visible';
  }

  function remember(node) {
    if (!hasKnownMarker(node)) return;

    const key = rootKey(node);
    if (!key) return;

    node.setAttribute(KEEP_ATTR, key);
    forceKeepStyle(node);
    kept.set(key, node);
    ensureMounted();
  }

  function ensureMounted() {
    repairFetch();

    const parent = mountParent();
    if (!parent) return;

    for (const [key, node] of kept) {
      const connected = Array.from(document.querySelectorAll(`[${KEEP_ATTR}]`)).find(
        (el) => el.getAttribute(KEEP_ATTR) === key
      );
      if (connected && connected !== node) {
        kept.set(key, connected);
        continue;
      }

      forceKeepStyle(node);
      if (node.parentNode !== parent) {
        parent.appendChild(node);
      }
    }
  }

  function scan(nodes) {
    nodes.forEach((node) => {
      if (!isElement(node)) return;
      remember(node);
      node.querySelectorAll && node.querySelectorAll(Array.from(KEEP_IDS, (id) => `#${cssEscape(id)}`).join(',')).forEach(remember);
    });
  }

  function startKeeper() {
    const parent = mountParent();
    if (!parent || window.__ystonePageKeeperStarted) return;
    window.__ystonePageKeeperStarted = true;

    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => scan(mutation.addedNodes));
      ensureMounted();
    }).observe(parent, {
      childList: true,
      subtree: true,
    });

    scan(parent.childNodes);
    repairFetch();
    setInterval(ensureMounted, 500);
  }

  if (document.documentElement || document.body) {
    startKeeper();
  } else {
    document.addEventListener('DOMContentLoaded', startKeeper, { once: true });
  }
})();
