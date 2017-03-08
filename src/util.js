/* jslint node: true, esnext: true */

'use strict';

export function quote(str) {
  return `"${str}"`;
}

export function quoteIfNeeded(str) {
  if (str.match(/^[a-z_][a-z0-9_]*$/i))
    return str;
  else
    return `"${str}"`;
}

export function unquoteList(str) {
  return str.split(',').map(
    e => e.replace(/^[\'\"]/, '').replace(/[\'\"]$/, ''));
}

export function unquote(str) {
  return str.replace(/^[\'\"]/, '').replace(/[\'\"]$/, '');
}
