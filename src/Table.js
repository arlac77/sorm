/* jslint node: true, esnext: true */

'use strict';


export class Table {
  constructor(name,attributes,constraints)
  {
    Object.defineProperty(this, 'name', { value: name });
  }
}
