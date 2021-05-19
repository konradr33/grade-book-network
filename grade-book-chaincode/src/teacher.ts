import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { Grade } from './models/grade';
import { Subject } from './models/subject';
import {
  assertUserRole,
  assetExist,
  getAssetType,
  getFromState,
  getHexHash,
  getHistory,
  getSubjectHash,
  iterateOverState,
} from './utils';

@Info({ title: 'Teacher', description: 'Smart contract for adding subjects, grades' })
export class TeacherContract extends Contract {
  private static async validateNewGrade(ctx: Context, subjectID: string, studentName: string) {
    if (await assetExist(ctx, subjectID)) {
      const subject = await getFromState<Subject>(ctx, subjectID);
      const student = subject?.students.find((value) => value === studentName);
      if (!student) {
        throw new Error(`Student does not belong to subject`);
      }
    } else {
      throw new Error(`Subject with id ${subjectID} does not exist`);
    }
  }

  private static async getValidatedSubject(ctx: Context, username: string, subjectID: string): Promise<Subject> {
    if (!(getAssetType(subjectID) === 'subject')) {
      throw new Error(`Asset with id ${subjectID} is not a subject`);
    }
    let subject: Subject;

    if (await assetExist(ctx, subjectID)) {
      subject = await getFromState<Subject>(ctx, subjectID);
    } else {
      throw new Error(`Subject with id ${subjectID} does not exist`);
    }

    if (subject.leader !== username) {
      throw new Error(`User is not a owner of subject`);
    }

    return subject;
  }

  private static async getValidatedGrade(ctx: Context, username: any, gradeID: string): Promise<Grade> {
    if (!(getAssetType(gradeID) === 'grade')) {
      throw new Error(`Asset with id ${gradeID} is not a grade`);
    }
    let grade: Grade;

    if (await assetExist(ctx, gradeID)) {
      grade = await getFromState<Grade>(ctx, gradeID);
    } else {
      throw new Error(`Grade with id ${gradeID} does not exist`);
    }

    if (grade.issuer !== username) {
      throw new Error(`User is not a owner of grade`);
    }

    return grade;
  }

  @Transaction(false)
  public async GetSubjects(ctx: Context): Promise<Subject[]> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const subjects: Subject[] = [];

    await iterateOverState<Subject>(ctx, 'subject.', 'subject/', (subject: Subject) => {
      if (subject.leader === username) {
        subjects.push(subject);
      }
    });

    return subjects;
  }

  @Transaction(true)
  public async CreateSubject(ctx: Context, name: string, description: string, studentsJSON: string): Promise<Subject> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;

    const subjectProto = {
      leader: username,
      updatedAt: timestamp,
      createdAt: timestamp,
      students: JSON.parse(studentsJSON),
      name,
      description,
    };

    const id = `subject.${getHexHash(JSON.stringify(subjectProto))}`;
    if (await assetExist(ctx, id)) {
      throw new Error(`Could not create subject with id: ${id}, subject with that id already exists`);
    }
    const newSubject: Subject = { ID: id, ...subjectProto };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(newSubject)));
    return newSubject;
  }

  @Transaction(true)
  public async UpdateSubject(
    ctx: Context,
    subjectID: string,
    name: string,
    description: string,
    studentsJSON: string,
  ): Promise<Subject> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const subject = await TeacherContract.getValidatedSubject(ctx, username, subjectID);

    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;

    const subjectProto = {
      ...subject,
      updatedAt: timestamp,
      students: JSON.parse(studentsJSON),
      name,
      description,
    };

    await ctx.stub.putState(subjectID, Buffer.from(JSON.stringify(subjectProto)));
    return subjectProto;
  }

  @Transaction(true)
  public async DeleteSubject(ctx: Context, subjectID: string): Promise<boolean> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    await TeacherContract.getValidatedSubject(ctx, username, subjectID);

    await ctx.stub.deleteState(subjectID);
    return true;
  }

  @Transaction(false)
  public async GetSubjectGrades(ctx: Context, subjectID: string): Promise<Grade[]> {
    assertUserRole(ctx, 'teacher');

    const subjectHash = getSubjectHash(subjectID);
    const grades: Grade[] = [];

    if (!(await assetExist(ctx, subjectID))) {
      throw new Error(`Subject with id ${subjectID} does not exist`);
    }

    await iterateOverState<Grade>(ctx, `grade.${subjectHash}.`, `grade.${subjectHash}/`, (grade: Grade) => {
      grades.push(grade);
    });

    return grades;
  }

  @Transaction(true)
  public async CreateGrade(
    ctx: Context,
    subjectID: string,
    studentName: string,
    grade: string,
    description: string,
  ): Promise<Grade> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;
    const subjectHash = getSubjectHash(subjectID);

    const gradeProto = {
      issuer: username,
      updatedAt: timestamp,
      createdAt: timestamp,
      grade,
      description,
    };

    await TeacherContract.validateNewGrade(ctx, subjectID, studentName);

    const id = `grade.${subjectHash}.${studentName}.${getHexHash(JSON.stringify(gradeProto))}`;
    if (await assetExist(ctx, id)) {
      throw new Error(`Could not create grade with id: ${id}, grade with that id already exists`);
    }
    const newGrade: Grade = { ID: id, ...gradeProto };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(newGrade)));
    return newGrade;
  }

  @Transaction(true)
  public async UpdateGrade(ctx: Context, gradeID: string, grade: string, description: string): Promise<Grade> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    let gradeAsset = await TeacherContract.getValidatedGrade(ctx, username, gradeID);
    const timestamp: number = ctx.stub.getTxTimestamp().seconds.low * 1000;

    gradeAsset = {
      ...gradeAsset,
      updatedAt: timestamp,
      grade,
      description,
    };

    await ctx.stub.putState(gradeAsset.ID, Buffer.from(JSON.stringify(gradeAsset)));
    return gradeAsset;
  }

  @Transaction(true)
  public async DeleteGrade(ctx: Context, gradeID: string): Promise<boolean> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const gradeAsset = await TeacherContract.getValidatedGrade(ctx, username, gradeID);

    await ctx.stub.deleteState(gradeAsset.ID);
    return true;
  }

  @Transaction(false)
  public async GetGrade(ctx: Context, gradeID: string): Promise<Grade> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    return await TeacherContract.getValidatedGrade(ctx, username, gradeID);
  }

  @Transaction(false)
  public async GetGradeHistory(ctx: Context, gradeID: string): Promise<Grade[]> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    await TeacherContract.getValidatedGrade(ctx, username, gradeID);

    const promiseOfIterator = ctx.stub.getHistoryForKey(gradeID);
    return await getHistory(promiseOfIterator);
  }

  @Transaction(false)
  public async GetSubject(ctx: Context, subjectID: string): Promise<Subject> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    return await TeacherContract.getValidatedSubject(ctx, username, subjectID);
  }

  @Transaction(false)
  public async GetSubjectHistory(ctx: Context, subjectID: string): Promise<Subject[]> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    await TeacherContract.getValidatedSubject(ctx, username, subjectID);

    const promiseOfIterator = ctx.stub.getHistoryForKey(subjectID);
    return await getHistory(promiseOfIterator);
  }
}
