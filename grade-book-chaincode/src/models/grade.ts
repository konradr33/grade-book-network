import {Object, Property} from 'fabric-contract-api';
import {IObjectBase} from './object-base';

@Object()
export class Grade implements IObjectBase {
    @Property()
    public ID: string;

    @Property()
    public issuer: string;

    @Property()
    public grade: string;

    @Property()
    public description?: string;

    @Property()
    public updatedAt: number;

    @Property()
    public createdAt: number;
}
