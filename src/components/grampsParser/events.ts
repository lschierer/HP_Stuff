import {html, LitElement, type PropertyValues, type TemplateResult, nothing} from 'lit';
import {property, state} from 'lit/decorators.js';
import {when} from 'lit/directives/when.js';

import { z} from "zod";
import {DateTime, Interval} from 'luxon';

import { grampsDataController } from './state';

import {type Database, type Event, type EventrefElement, type NameElement, type Person} from './GrampsTypes';

import {TailwindMixin} from "../tailwind.element";

import style from '../../styles/Event.css?inline'

export class GrampsEvent extends TailwindMixin(LitElement,style) {

    @state()
    public gController = new grampsDataController(this);

    @property({type: String, reflect: true})
    public eventId: string;
    
    @state()
    private _event: Event | null;
    
    @property({type: String})
    public grampsId: string;

    @property({type: String})
    public grampsId2: string;

    @property({type: String})
    public familyId: string;

    @property({type: Boolean})
    public simpleDate: boolean;

    @property({type: Boolean})
    public showDeath: boolean;

    @property({type: Boolean})
    public showBirth: boolean;

    @property({type: Boolean})
    public showBDRange: boolean;

    @property({type: Boolean})
    public showOther: boolean;

    @property({type: Boolean})
    public simplePlace: boolean;

    @property({type: Boolean})
    public showPlace: boolean;

    @property({type: Boolean})
    public showMarriage: boolean

    @state()
    private _i1: Person | null;

    @state()
    private _i2: Person | null;

    constructor() {
        super();

        this.eventId = '';
        this._event  = null;
        this.familyId = '';
        this.grampsId = '';
        this.grampsId2 = '';
        this._i1 = null;
        this._i2 = null;
        this.showBirth = false;
        this.showDeath = false;
        this.showMarriage = false;
        this.showBDRange = false;
        this.showOther = false;
        this.simpleDate = false;
        this.simplePlace = false;
        this.showPlace = false;

    }

    public setEvent(e: Event | null | undefined) {
        if(e) {
            this._event = e;
        } else {
            this._event = null;
        }
    }

    public getEvent() {
        return this._event;
    }

    public async willUpdate(changedProperties: PropertyValues<this>) {
        super.willUpdate(changedProperties)
        
        if (this.gController && this.gController.parsedStoreController && this.gController.parsedStoreController.value) {
            console.log(`willUpdate; controlers are ready to render`)
            const db: Database = this.gController.parsedStoreController.value.database;
            if (changedProperties.has('grampsId') && this.grampsId) {
                const filterResult = db.people.person.filter((v) => {
                    return v.id === this.grampsId
                })
                if (filterResult && filterResult.length > 0) {
                    console.log(`willUpdate; filter returned people`)
                    const first = filterResult.shift();
                    if (first) {
                        console.log(`willUpdate; and the first was valid`);
                        this._i1 = first;
                        console.log(`willUpdate; I first need to find the envent`)
                        if(this.showBirth ) {
                            console.log(`willUpdate; looking for a birth record for ${this.grampsId}`)
                            if(this._i1) {
                                const e = this.findBirthByPerson(this._i1);
                                if(e) {
                                    this.eventId = e.id;
                                    this._event = e;
                                }
                            }
                        }
                        if(this.showDeath) {
                            console.log(`willUpdate; I am looking for a death record`)
                            if(this._i1) {
                                const e = this.findDeathByPerson(this._i1);
                                if(e) {
                                    this.eventId = e.id;
                                    this._event = e;
                                }
                            }
                        }
                    }
                } else {
                    console.error(`willUpdate; cannot find person for ${this.grampsId}`)
                }
            }
            if(changedProperties.has('familyId') && this.familyId) {
                if(this.showMarriage) {
                    console.log(`render; looking for marriage event of ${this.familyId}`);
                    const family = db.families.family.filter((f) => {
                        return (!f.id.localeCompare(this.familyId))
                    }).shift();
                    if(family && family.eventref) {
                        const fer = family.eventref.hlink;
                        const gme = db.events.event.filter((f) => {
                            return (!f.handle.localeCompare(fer))
                        }).shift();
                        if(gme) {
                            this.eventId = gme.id;
                            this._event = gme;
                        }
                    }
                }
            }
        }
    }

    private findDeathByPerson(individual: Person) {
        console.log(`findBirthByPerson; start`)
        const db = this.gController.parsedStoreController.value;
        if(db) {
            const events = this.findEventsByPerson(individual);
            if(events) {
                console.log(`findBirthByPerson; person has ${events.length} events`)
                return events.filter(e => {
                    return (e.type === 'Death')
                }).shift();
            }
        }
        return null;
    }
    
    public findBirthByPerson(individual: Person) {
        console.log(`findBirthByPerson; start`)
        const db = this.gController.parsedStoreController.value;
        if(db) {
            const events = this.findEventsByPerson(individual);
            if(events) {
                console.log(`findBirthByPerson; person has ${events.length} events`)
                return events.filter(e => {
                    return (e.type === 'Birth')
                }).shift();
            }
        }
        return null;
    }
    
    public findEventsByPerson(individual: Person) {
        console.log(`findEventsByPerson; start`)
        const refs:EventrefElement[] | EventrefElement | undefined = individual.eventref;
        const db = this.gController.parsedStoreController.value;
        if(db) {
            if(refs) {
                console.log(`findEventsByPerson; I have refs to search`)
                const r = [refs].flat()
                return db.database.events.event.filter((e) => {
                    const _id = e.handle;
                    if(_id) {
                        let result = false;
                        r.forEach((ref) => {
                            const link = ref.hlink;
                            if(!_id.localeCompare(link)) {
                                console.log(`findBirthByPerson; found event for person`)
                                result = true;
                            }
                        })
                        return result;
                    }
                    return false;
                })
            }
            
        }
        return null;
    }
    
    private displayDate(event: Event) {
        let t = html``
        let d: DateTime | null = null;
        let i: Interval | null = null;
        if(event.dateval) {
            if(event.dateval.type) {
                t = html`${event.dateval.type} `
            }
            if(typeof event.dateval.val === 'string') {
                d = DateTime.fromISO(event.dateval.val)
            } else{
                d = DateTime.fromISO(event.dateval.val.toString())
            }
        } else if (event.datestr) {
            d = DateTime.fromISO(event.datestr.val)
        }else if (event.daterange) {
            let d2: DateTime;
            if(typeof event.daterange.start === 'string') {
                d = DateTime.fromISO(event.daterange.start)
            } else  {
                d = DateTime.fromISO(event.daterange.start.toString())
            }
            if(typeof event.daterange.stop === 'number') {
                d2 = DateTime.fromISO(event.daterange.stop.toString())
            } else  {
                d2 = DateTime.fromJSDate(event.daterange.stop)
            }
            i = Interval.fromDateTimes(d, d2);
        }else if(event.datespan) {
            let d2: DateTime;
            if(typeof event.datespan.start === 'string') {
                d = DateTime.fromISO(event.datespan.start)
            } else {
                d = DateTime.fromISO(event.datespan.start.toString())
            }
            if(typeof event.datespan.stop === 'number') {
                d2 = DateTime.fromISO(event.datespan.stop.toString())
            } else {
                d2 = DateTime.fromJSDate(event.datespan.stop)
            }
            i = Interval.fromDateTimes(d, d2);
        }
        if(i) {
            return html`${t} ${d ? this.simpleDate ? i.toFormat('YYYY') : i.toISODate() : nothing}`
        }
        return html`${t} ${d ? this.simpleDate ? d.get('year') : d.toISODate() : nothing}`
    }

    public render() {
        let t = html``
        if (this.gController && this.gController.parsedStoreController && this.gController.parsedStoreController.value) {
            console.log(`render; controllers are ready to render`)
            const db: Database = this.gController.parsedStoreController.value.database;
            if(this.eventId) {
                console.log(`render; I know which event to work with`)
                const e = db.events.event.filter((e) => {
                    return (!e.id.localeCompare(this.eventId))
                }).shift();
                if(e && !this._event) {
                    this.eventId = e.id;
                    this._event = e;
                }
                t = html`${t}${this.displayDate(this._event!)}`
            }
        }
        
        return html`${t}`;
    }

}
customElements.define('gramps-event', GrampsEvent);
