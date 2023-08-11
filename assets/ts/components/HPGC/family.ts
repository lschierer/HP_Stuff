import {LitElement, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {when} from 'lit/directives/when.js';
import {html, literal} from 'lit/static-html.js';

import {HPGC} from ".";

import * as rgc from 'read-gedcom';

@customElement('hp-family')
export class HPFamily extends LitElement {

  @property({type: String, reflect: true})
  public SurName: string;

  @property({reflect: true})
  public Members: rgc.SelectionIndividualRecord[];


  public constructor() {
    super();

    this.SurName = '';
    this.Members = [];

  };

  public connectedCallback() {
    super.connectedCallback();
    console.log('connector call back');
    window.addEventListener('GedLoaded', (e: Event) => this.Members = this.findMembers((e.target as Element)));
  };

  public disconnectedCallback() {
    window.removeEventListener('GedLoaded', (e: Event) => this.Members = this.findMembers((e.target as Element)));
    console.log('disconnected callback');
    super.disconnectedCallback();
  };

  protected findMembers(target: Element) {
    const g = (target as HPGC).myGedData;
    var m: rgc.SelectionIndividualRecord[] = [];
    if ((typeof(this.SurName) !== 'undefined') && (this.SurName !== '')) {
      console.log('Sur is ' + this.SurName);
      g.getIndividualRecord().arraySelect().forEach(i => {
        const s = (i.getName() as rgc.SelectionNamePieces).filterSelect(nameField => !(nameField as rgc.SelectionName).getType().value().includes(rgc.ValueNameType.Married)).getSurname().value();
        if((s !== null) && (typeof(s) !== 'undefined')) {
          console.log('type is ' + typeof(s));
          if(Array.isArray(s)) {
            s.forEach(v => {
              if((v !== null) && (v.normalize() === this.SurName.normalize())) {
                m.push(i);
              } else {
              }
            });
          } else if(typeof(s) === 'string') {
            if((s as string).normalize() === this.SurName.normalize()) {
              m.push(i);
            } else {
            }
          } else {
            console.log('entry neither a string nor array');
          }
        }
      });
      console.log('Members at ' + m.length);
    }
    console.log('about to return, m is at ' + m.length);
    return m;
  };

  protected render() {
    console.log('start of render');
    const myUrl = window.location.pathname;
    const myParentUrl = myUrl.slice(0, myUrl.slice(0,-1).lastIndexOf('/')) + '/';
    console.log('my parent is ' + myParentUrl);
    
    const lis = [];
    for (const i of this.Members) {
      const n = i.getName();
      var f: (string | null)[] | undefined = undefined;
      var l: (string | null)[] | undefined = undefined;
      var s: (string | null)[] | undefined = undefined;
      const iNamePartsNonMaiden: (null | (undefined | string)[])[] = i.getName()
        .filterSelect(nameField => !(nameField as rgc.SelectionName).getType().value().includes(rgc.ValueNameType.Married)).valueAsParts();

      if( (iNamePartsNonMaiden!== null) && (typeof(iNamePartsNonMaiden) !== 'undefined')) {
        console.log('values are: ' + iNamePartsNonMaiden);
        f = i.getName().filterSelect(nameField => !nameField.getType().value().includes(rgc.ValueNameType.Married)).getGivenName().value();
        l = i.getName().filterSelect(nameField => !nameField.getType().value().includes(rgc.ValueNameType.Married)).getSurname().value();
        s = i.getName().filterSelect(nameField => !nameField.getType().value().includes(rgc.ValueNameType.Married)).getNameSuffix().value();
        var PUrl = '';
        if((typeof(f) !== 'undefined') && (f.length > 0) && (f[0] !== '') && (f[0] !== null)) {
          PUrl = f[0].replace(/ /g, "_");
        } else {
          PUrl = '';
        }
        if((typeof(s) !== 'undefined') && (s.length > 0) && (s[0] !== '') && (s[0] !== null)) {
          PUrl = PUrl + `_${s}`;
        } 
        lis.push(html`<li><a href="${myParentUrl}${PUrl}">${f} ${l} ${s}</a></li>`);
      } else {
        console.log('why is n null?');
      }
    }

    return html`
      <h4 class="h3">${this.SurName}</h4>
      We have ${this.Members.length} members of the ${this.SurName} family.
      <ul>
        ${lis}
      </ul>
    `;
  };

}

// vim: shiftwidth=2:tabstop=2:expandtab

