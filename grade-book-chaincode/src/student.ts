import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { Grade } from './models/grade';
import { Subject } from './models/subject';
import { assertUserRole, getSubjectHash, iterateOverState } from './utils';

@Info({ title: 'Student', description: 'Smart contract for getting student grades, subjects' })
export class StudentContract extends Contract {
  @Transaction()
  public async InitLedger(ctx: Context): Promise<void> {
    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;

    const assets: Array<Grade | Subject> = [
      {
        ID: 'subject.1',
        leader: '',
        name: '',
        description: '',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'subject.2',
        leader: '',
        name: '',
        description: '',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'subject.3',
        leader: '',
        name: '',
        description: '',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.2',
        grade: '5',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.2',
        grade: '2',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.3',
        grade: '4',
        issuer: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    for (const asset of assets) {
      await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
      console.info(`Asset ${asset.ID} initialized`);
    }
  }

  @Transaction(false)
  public async GetSubjects(ctx: Context): Promise<Subject[]> {
    assertUserRole(ctx, 'student');
    console.info(ctx.stub.getTxID());
    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const subjects: Subject[] = [];

    await iterateOverState<Subject>(ctx, 'subject.', 'subject/', (subject: Subject) => {
      if (subject.students.find((value) => username === value)) {
        subjects.push(subject);
      }
    });

    return subjects;
  }

  @Transaction(false)
  public async GetGrades(ctx: Context, subjectID: string): Promise<Grade[]> {
    assertUserRole(ctx, 'student');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const subjectHash = getSubjectHash(subjectID);
    const grades: Grade[] = [];

    await iterateOverState<Grade>(
      ctx,
      `grade.${subjectHash}.${username}.`,
      `grade.${subjectHash}.${username}/`,
      (grade: Grade) => {
        grades.push(grade);
      },
    );

    return grades;
  }
}
