import {LitElement, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {when} from 'lit/directives/when.js';
import {html, literal} from 'lit/static-html.js';

import {HPGC} from ".";

import { readGedcom, toJsDate } from 'read-gedcom';
import * as rgc from 'read-gedcom';

@customElement('hp-person')
export class HPPerson extends LitElement {

  @property({type: String, reflect: true})
  public myGedId: string;

  @property({type: Date, reflect: true}) 
  public myBirthday: (Date|null)[];

  @property({type: Date, reflect: true}) 
  public myDeathday: (Date|null)[];

  @state()
  private myParent: rgc.SelectionGedcom;

  public connectedCallback() {
    super.connectedCallback();
    console.log('connector call back');
    window.addEventListener('GedLoaded', (e: Event) => this.myBirthday = this.birthday((e.target as Element)));
    window.addEventListener('GedLoaded', (e: Event) => this.myDeathday = this.deathday((e.target as Element)));
  };

  public disconnectedCallback() {
    window.removeEventListener('GedLoaded', (e: Event) => this.myBirthday = this.birthday((e.target as Element)));
    window.removeEventListener('GedLoaded', (e: Event) => this.myBirthday = this.deathday((e.target as Element)));
    console.log('disconnected callback');
    super.disconnectedCallback();
  };

  public constructor() {
    super ();

    this.myParent = ((this as Node).parentNode! as HPGC).myGedData;
    this.myBirthday = [null];
		this.myDeathday = [null];

    this.myGedId = '';
    console.log('person constructor complete');
  };

  public birthday(target: Element) {
    console.log('birthday function called');
    var p = target;
    console.log(`p is a ${p.tagName}`);

    const g = (p as HPGC).myGedData;

    if ((typeof(this.myGedId) !== 'undefined') && (this.myGedId !== '')) {
      console.log(`in birthday, GedId is ${this.myGedId}`);
      const i = g.getIndividualRecord(`${this.myGedId}`);
      console.log('individual is ' + i.toString());
      this.myBirthday = g.getIndividualRecord(`${this.myGedId}`)
        .getEventBirth()
        .getDate() 
        .valueAsDate()
        .map(d => {
          if(d && d.isDatePunctual) {
            const datePart = (d as rgc.ValueDatePunctual).date;
            return toJsDate(datePart);
          } else {
            return null;
          }
        });
      console.log(`in birthday after successful query, ${this.myBirthday}`);
      return this.myBirthday;
    } else {
      console.log('gedcom loaded before id string set');
      return [null];
    }

    console.log('reached the end of birthday without returning');
    
  };

  public deathday(target: Element) {
    var p = target;
    const g = (p as HPGC).myGedData;

    if ((typeof(this.myGedId) !== 'undefined') && (this.myGedId !== '')) {
      const i = g.getIndividualRecord(`${this.myGedId}`);
      console.log('individual is ' + i.toString());
      this.myDeathday = i.getEventDeath()
        .getDate() 
				.valueAsDate()
        .map(d => {
          if(d && d.isDatePunctual) {
            const datePart = (d as rgc.ValueDatePunctual).date;
            return toJsDate(datePart);
          } else {
            return null;
          }
        });
      console.log(`in deathday after successful query, ${this.myDeathday}`);
      return this.myDeathday;
    } else {
      console.log('gedcom loaded before id string set');
      return [null];
    }

    console.log('reached the end of deathday without returning');
    
  };

  protected render() { 
    return html`
    <div class="mb-0" id="bio-info" .myGedId=${this.myGedId} >
      Birthday: <span>${when(
        ((typeof(this.myBirthday) !== 'undefined') && (this.myBirthday !== null) && ( this.myBirthday.length > 0)), 
        () => html`${this.myBirthday}`, 
        () => html`Unknown Birthday`
      )}</span><br/>
      Deathday: <span>${when(
        ((typeof(this.myDeathday) !== 'undefined') && (this.myDeathday !== null) ), 
        () => html`${this.myDeathday}`, 
        () => html`Unknown date of death`
      )}</span><br/>
    </div>
    `;
  };

}

// vim: shiftwidth=2:tabstop=2:expandtab

