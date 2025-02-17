/*
 * This is intended as base class to be extended by one that simply implements a
 * constructor providing the secctions.
 * Because I'm using a complex object as the property type, it is almost useless on its own.
 */

export type CardDetails = {
  title: string;
  name: string;
  description?: string;
  target?: string;
};
