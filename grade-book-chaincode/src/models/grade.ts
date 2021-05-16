import {Object, Property} from 'fabric-contract-api';
import {ObjectType} from "./object-type";
import {IObjectBase} from "./object-base";

@Object()
export class Grade implements IObjectBase {
    @Property()
    public ID: string;

    @Property()
    public objectType: ObjectType;

    @Property()
    public issuer?: string;

    @Property()
    public student: string;

    @Property()
    public grade: string;

    @Property()
    public subject: string;

    @Property()
    public timestamp: number;
}
