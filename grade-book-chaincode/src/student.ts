import {Context, Contract, Info, Transaction} from 'fabric-contract-api';
import {Grade} from './models/grade';
import {Subject} from './models/subject';

@Info({title: 'Student', description: 'Smart contract for getting student grades, subjects'})
export class StudentContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const assets: Array<Grade | Subject> = [
            {
                ID: 'subject/1',
                leader: '',
                name: '',
                description: '',
                students: ['user1'],
                timestamp: Date.now(),
            },
            {
                ID: 'subject/2',
                leader: '',
                name: '',
                description: '',
                students: ['user1'],
                timestamp: Date.now(),
            },
            {
                ID: 'subject/3',
                leader: '',
                name: '',
                description: '',
                students: ['user1'],
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user2/1/1',
                grade: '5',
                issuer: '',
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user2/1/2',
                grade: '5',
                issuer: '',
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user3/1/1',
                grade: '5',
                issuer: '',
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user1/1/1',
                grade: '5',
                issuer: '',
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user1/1/2',
                grade: '2',
                issuer: '',
                timestamp: Date.now(),
            },
            {
                ID: 'grade/user1/1/3',
                grade: '4',
                issuer: '',
                timestamp: Date.now(),
            },
        ];

        for (const asset of assets) {
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }

    @Transaction(false)
    public async GetSubjects(ctx: Context): Promise<Subject[]> {
        if (!ctx.clientIdentity.assertAttributeValue('role', 'student')) {
            throw new Error(`Client is not a student`);
        }

        const username =  ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
        const subjects: Subject[] = [];

        const iterator = await ctx.stub.getStateByRange('subject/', 'subject0');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let subject: Subject;
            try {
                subject = JSON.parse(strValue);
                if (subject.students.find((value) => username === value)) {
                    subjects.push(subject);
                }
            } catch (err) {
                console.info('Error during subject parsing', err);
            }
            result = await iterator.next();
        }
        return subjects;
    }

    @Transaction(false)
    public async GetGrades(ctx: Context, subjectID: string): Promise<Grade[]> {
        if (!ctx.clientIdentity.assertAttributeValue('role', 'student')) {
            throw new Error(`Client is not a student`);
        }

        const username =  ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
        const subjectHash =  subjectID.split('/').length > 1 ? subjectID.split('/')[1] : '';
        const grades: Grade[] = [];

        const iterator = await ctx.stub.getStateByRange(`grade/${username}/${subjectHash}/`, `grade/${username}/${subjectHash}0`);
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let grade: Grade;
            try {
                grade = JSON.parse(strValue);
                grades.push(grade);
            } catch (err) {
                console.info('Error during grade parsing', err);
            }
            result = await iterator.next();
        }
        return grades;
    }

}
