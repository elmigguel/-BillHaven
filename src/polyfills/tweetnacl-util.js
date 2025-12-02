// ESM wrapper for tweetnacl-util (CommonJS compatibility)
// This fixes: "does not provide an export named 'default'"

const util = {};

function validateBase64(s) {
  if (!(/^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(s))) {
    throw new TypeError('invalid encoding');
  }
}

util.decodeUTF8 = function(s) {
  if (typeof s !== 'string') throw new TypeError('expected string');
  const encoder = new TextEncoder();
  return encoder.encode(s);
};

util.encodeUTF8 = function(arr) {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
};

util.encodeBase64 = function(arr) {
  const uint8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
};

util.decodeBase64 = function(s) {
  validateBase64(s);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Named exports
export const decodeUTF8 = util.decodeUTF8;
export const encodeUTF8 = util.encodeUTF8;
export const encodeBase64 = util.encodeBase64;
export const decodeBase64 = util.decodeBase64;

// Default export (the entire util object)
export default util;
