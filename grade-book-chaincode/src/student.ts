/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {Context, Contract, Info, Transaction} from 'fabric-contract-api';
import {Grade} from './models/grade';
import {ObjectType} from './models/object-type';
import {Subject} from './models/subject';

@Info({title: 'Student', description: 'Smart contract for getting student grades, subjects'})
export class StudentContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const assets: Array<Grade | Subject> = [
            {
                ID: 'subject-1',
                objectType: ObjectType.SUBJECT,
                leader: '',
                name: '',
                description: '',
                students: ['user1'],
                timestamp: Date.now(),
            },
            {
                ID: 'grade1',
                grade: '5',
                issuer: '',
                student: 'user1',
                subject: 'subject-1',
                timestamp: Date.now(),
                objectType: ObjectType.GRADE,
            },
            {
                ID: 'grade2',
                grade: '2',
                issuer: '',
                student: 'user1',
                subject: 'subject-1',
                timestamp: Date.now(),
                objectType: ObjectType.GRADE,
            },
            {
                ID: 'grade3',
                grade: '4',
                issuer: '',
                student: 'user1',
                subject: 'subject-1',
                timestamp: Date.now(),
                objectType: ObjectType.GRADE,
            },
        ];

        for (const asset of assets) {
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }

    @Transaction(false)
    public async GetSubjects(ctx: Context): Promise<Subject[]> {
        console.log('getCreator', ctx.stub.getCreator());
        ctx.clientIdentity.getAttributeValue('Common Name');
        console.log('ctx.clientIdentity.getID()', ctx.clientIdentity.getID());
        console.log('ctx.clientIdentity.getMSPID()', ctx.clientIdentity.getMSPID());
        console.log('tx.clientIdentity.getIDBytes()', ctx.clientIdentity.getIDBytes());
        console.log('ctx.clientIdentity. getAttributeValue(\'Common Name\')', ctx.clientIdentity.getAttributeValue('Common Name'));
        console.log('ctx.clientIdentity. getAttributeValue(\'cn\')', ctx.clientIdentity.getAttributeValue('cn'));

        return [];
    }

    @Transaction(false)
    public async GetGrades(ctx: Context, subjectName: string): Promise<Grade[]> {

        return [];
    }

}
