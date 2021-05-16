import {Object, Property} from 'fabric-contract-api';
import {IObjectBase} from './object-base';
import {ObjectType} from './object-type';

@Object()
export class Subject implements IObjectBase {

    @Property()
    public ID: string;

    @Property()
    public objectType: ObjectType;

    @Property()
    public leader: string;

    @Property()
    public students: string[];

    @Property()
    public name: string;

    @Property()
    public description: string;

    @Property()
    public timestamp: number;
}
