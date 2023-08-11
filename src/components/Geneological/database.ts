import {LitElement, html } from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import { readGedcom } from 'read-gedcom';
import type * as rgc from 'read-gedcom';
import { atom } from 'nanostores';

@customElement('gedcom-db')
export class GedcomDb extends LitElement  {

    @property()
    public url: URL|string|null;

    @property()
    public GedData: rgc.SelectionGedcom | null;

    @state()
    private GedUrl: URL|null;

    public constructor() {
        super();
        console.log(`gedcom-db constructor called`);
        this.url = null;
        this.GedUrl = null;
        this.GedData = null;

    }

    private setGedStore(gedc: rgc.SelectionGedcom) {
           console.log(`in setGedStore gedc is ${typeof(gedc)}`)
            if(gedc) {
                console.log(gedc.getHeader().toString());
                this.GedData = gedc;
            } else {
                console.log('in setGedStore promise, gedc is null')
            }
        const g = this.GedData;
        if(g) {
            console.log(`returning from GedcomDB connected callback`)
            console.log(g.getHeader().toString())
            const event = new CustomEvent('GedLoaded', {
                bubbles: true,
                composed: true,
            });
            this.dispatchEvent(event);
            if (event.defaultPrevented) {
                event.preventDefault();
            }
            this.requestUpdate();
        } else {
            console.log('in setGedStore nanostore setter failed')
        }

    }

    connectedCallback() {
        super.connectedCallback()
        console.log(`in connected callback, url is ${this.url}`)
        if(this.url) {
            this.GedUrl = new URL('/potter_universe.ged', this.url );

            const GedPromise = fetch(this.GedUrl)
                .then(response => {
                    if (response.ok ) {
                        return response.arrayBuffer();
                    } else {
                        console.log(`in GedcomDb fetch failed`);
                        throw new Error(`Fetch failed in GedcomDb`);

                    }
                })
                .then(readGedcom)
                .catch(error => console.log(error));

            GedPromise.then(sg => {
                if(sg) {
                    this.setGedStore(sg);
                }
            })
        }
    }

    render() {

        if(this.GedData) {
            const g = this.GedData;
            if(g) {
                const h = g.getHeader().toString();
                return html`
                <!--
                ${h}
                -->
            `
            } else {
                return html`
                    <!-- GedData is _something_ but not gettable -->
                `
            }

        } else {
            return html`<!-- no ged data loaded -->`;

        }

    }
}
