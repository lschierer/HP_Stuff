import {LitElement, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {guard} from 'lit/directives/guard.js';
import {when} from 'lit/directives/when.js';
import {html, literal} from 'lit/static-html.js';

@customElement('hp-cl')
export class HPCL extends LitElement {
  tag = literal`hp-cl`;

}

// vim: shiftwidth=2:tabstop=2:expandtab

