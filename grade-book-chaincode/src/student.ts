import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { Grade } from './models/grade';
import { Subject } from './models/subject';
import {
  assertUserRole,
  assetExist,
  getAssetType,
  getFromState,
  getHistory,
  getSubjectHash,
  getUserFromGradeID,
  iterateOverState,
} from './utils';

@Info({ title: 'Student', description: 'Smart contract for getting student grades, subjects' })
export class StudentContract extends Contract {
  public static async getStudentGrade(ctx: Context, username: string, gradeID: string): Promise<Grade> {
    if (!(getAssetType(gradeID) === 'grade')) {
      throw new Error(`Asset with id ${gradeID} is not a grade`);
    }
    let grade: Grade;

    if (await assetExist(ctx, gradeID)) {
      grade = await getFromState<Grade>(ctx, gradeID);
    } else {
      throw new Error(`Grade with id ${gradeID} does not exist`);
    }

    if (username !== getUserFromGradeID(gradeID)) {
      throw new Error(`User is not a owner of grade`);
    }

    return grade;
  }

  private static async getStudentSubject(ctx: Context, username: string, subjectID: string): Promise<Subject> {
    if (!(getAssetType(subjectID) === 'subject')) {
      throw new Error(`Asset with id ${subjectID} is not a subject`);
    }
    let subject: Subject;

    if (await assetExist(ctx, subjectID)) {
      subject = await getFromState<Subject>(ctx, subjectID);
    } else {
      throw new Error(`Subject with id ${subjectID} does not exist`);
    }

    if (!subject.students.find((value) => username === value)) {
      throw new Error(`User is not participant of subject`);
    }

    return subject;
  }

  @Transaction()
  public async InitLedger(ctx: Context): Promise<void> {
    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;

    const assets: Array<Grade | Subject> = [
      {
        ID: 'subject.1',
        leader: 'teacher1',
        name: 'subject.1',
        description: 'subject.1 desc',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'subject.2',
        leader: 'teacher1',
        name: 'subject.2',
        description: 'subject.2 desc',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'subject.3',
        leader: 'teacher1',
        name: 'subject.3',
        description: 'subject.3 desc',
        students: ['user1'],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: 'teacher1',
        description: 'grade name',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.2',
        grade: '5',
        issuer: 'teacher1',
        description: 'grade name',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: 'teacher1',
        description: 'grade name',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.1',
        grade: '5',
        issuer: 'teacher1',
        description: 'grade name',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.2',
        grade: '2',
        issuer: 'teacher1',
        description: 'grade name',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        ID: 'grade.1.user1.3',
        grade: '4',
        issuer: 'teacher1',
        description: 'grade name',
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

  @Transaction(false)
  public async GetGrade(ctx: Context, gradeID: string): Promise<Grade> {
    assertUserRole(ctx, 'student');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    return await StudentContract.getStudentGrade(ctx, username, gradeID);
  }

  @Transaction(false)
  public async GetGradeHistory(ctx: Context, gradeID: string): Promise<any[]> {
    assertUserRole(ctx, 'student');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    await StudentContract.getStudentGrade(ctx, username, gradeID);

    const promiseOfIterator = ctx.stub.getHistoryForKey(gradeID);
    return await getHistory(promiseOfIterator);
  }

  @Transaction(false)
  public async GetSubject(ctx: Context, subjectID: string): Promise<Subject> {
    assertUserRole(ctx, 'student');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    return await StudentContract.getStudentSubject(ctx, username, subjectID);
  }

  @Transaction(false)
  public async GetSubjectHistory(ctx: Context, subjectID: string): Promise<Subject[]> {
    assertUserRole(ctx, 'student');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    await StudentContract.getStudentSubject(ctx, username, subjectID);

    const promiseOfIterator = ctx.stub.getHistoryForKey(subjectID);
    return await getHistory(promiseOfIterator);
  }
}
