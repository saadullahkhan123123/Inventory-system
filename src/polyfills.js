// Polyfills for older browser compatibility

// Object.hasOwn polyfill (ES2022)
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    if (obj == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(Object(obj), prop);
  };
}

// Ensure polyfill is available globally
if (typeof window !== 'undefined') {
  window.Object = window.Object || {};
  if (!window.Object.hasOwn) {
    window.Object.hasOwn = Object.hasOwn;
  }
}

export {};

