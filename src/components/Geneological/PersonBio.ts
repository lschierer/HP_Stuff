import { LitElement, html } from 'lit';
import {property, state} from 'lit/decorators.js';
import {createRef, ref } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref';
import {when} from 'lit/directives/when.js';
import { StoreController } from "@nanostores/lit";
import type { GedcomDb } from './database';
import type { SelectionGedcom } from 'read-gedcom';
import type * as rgc from "read-gedcom";
import {toJsDate, parseNameParts} from "read-gedcom";

type Props = Record<string, never>

export class PersonBio extends LitElement {

    @property({type: String, reflect: true})
    public gedid: string;

    @property()
    public url: string | null;

    @state()
    protected GedData: Ref<HTMLInputElement> = createRef();

    private gcDB: rgc.SelectionGedcom | null;

    @state()
    private gedDataAvailable: boolean;

    @state()
    private birthday: string | null;

    @state()
    private names: string | string[];

    public constructor(prop?: Props) {
        super();

        this.gedid = "0";

        this.names = "";
        this.birthday = null;

        this.gcDB = null;

        this.gedDataAvailable = false;

        if(prop) {
            console.log(`in PersonBio constructor properties were defined`)
            this.url = prop.url;
        } else {
            this.url = null;
            console.log(`in PersonBio constructor prop was undefined`)
        }

    }

    public connectedCallback() {
        super.connectedCallback();
        if(this.url) {
            console.log(`in connected callback, this.url is of type ${typeof(this.url)}`);
            console.log(`in connected callback, this.url is ${this.url}`)
        }
        this.addEventListener('GedLoaded', (e: Event) => this.gedDefined((e.target as Element)));
    }

    public disconnectedCallback() {
        window.removeEventListener('GedLoaded', (e: Event) => this.gedDefined((e.target as Element)));
        console.log('disconnected callback');
        super.disconnectedCallback();
    };

    private gedDefined(e: Element) {
        console.log('gedDefined is called');
        console.log(`e is a ${e.localName}`);
        console.log(`GedData is a ${this.GedData.value?.localName}`);
        if(this.GedData && this.GedData.value) {
            let g = (this.GedData.value as unknown as GedcomDb).GedData;
            if(g){
                this.gcDB = g;
                console.log(`in PersonBio gedDefined;`);
                let i = g.getIndividualRecord(`{this.id}`);
                if (!i) {
                    console.log(`person not found in db`);
                    return;
                } else {
                    console.log(`person found in db`);
                    console.log();
                    this.gedDataAvailable = true;
                    let b = this._birthday();
                    if(b) {
                        this.birthday = b;
                    }
                    let n = this._names();
                    if( n ) {
                        this.names = n;
                    } else {
                        console.log(`no names for this person!!!`)
                        return;
                    }
                    this.requestUpdate();

                }
                console.log(g.getHeader().toString());

            } else {
                console.log(`in PersonBio; getDefined called with GedData but value unreachable`)
            }
        } else {
            console.log(`in PersonBio; gedDefined called when GedData not defined`)
        }
    }

    private _birthday() {
        console.log(`in birthday, ged id is ${this.gedid}`);
        if(this.gcDB) {
            const v = this.gcDB;
            if(v) {
                v.getIndividualRecord(`{this.id}`)
                    .getEventBirth()
                    .getDate()
                    .valueAsDate()
                    .map(d =>{
                        if(d && d.isDatePunctual) {
                            const datePart = (d as rgc.ValueDatePunctual).date;
                            const j = toJsDate(datePart);
                            console.log(`in birthday returning ${j}`);
                            return j;
                        } else {
                            console.log(`no birthday to return`)
                            return null;
                        }
                    })
            } else {
                return "Waiting for Database to be populated"
            }
        } else {
            return "Waiting for Database to be available"
        }
    }

    private _names() {
        console.log(`in names, ged id is ${this.gedid}`);
        if(this.gcDB) {
            const v = this.gcDB;
            if (v) {
                const n =  v.getIndividualRecord(`{this.id}`)
                    .getName()
                    .valueAsParts();
                console.log(`n with length ${n.length} and content ${n}`);
                return n;
            } else {
                console.log( `_names 2`)
            }
        } else { console.log(`names 1`)}

    }


    render() {
        if(this.url) {
            console.log(`in PersonBio render, url is of type ${typeof(this.url)}`);
            console.log(`in PersonBio render, url is ${this.url}`);
            let t = html`
                <gedcom-db url="${this.url}" ${ref(this.GedData)} ></gedcom-db>
                Name: ${this.names}<br/>
            `;
            if(this.birthday){
                t = html`${t}Birthday: ${this.birthday}<br/>`
            }
            return html`${t}`;
        } else {
            return html`
                Please Wait for Database to be initialized.
            `
        }

    }

}

customElements.define('person-bio', PersonBio)