import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { Grade } from './models/grade';
import { Subject } from './models/subject';
import { assertUserRole, getFromState, getHexHash, getSubjectHash, iterateOverState } from './utils';

@Info({ title: 'Teacher', description: 'Smart contract for adding subjects, grades' })
export class TeacherContract extends Contract {

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
    if (await this.AssetExist(ctx, id)) {
        throw new Error(`Could not create subject with id: ${id}, subject with that id already exists` );
    }
    const newSubject: Subject = {  ID: id, ...subjectProto};
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(newSubject)));
    console.info('created subject', newSubject);
    return newSubject;
  }

  @Transaction(true)
  public async CreateGrade(ctx: Context, subjectID: string, studentName: string, grade: string, description: string): Promise<Grade> {
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

    await this.validateNewGrade(ctx, subjectID, studentName);

    const id = `grade.${subjectHash}.${studentName}.${getHexHash(JSON.stringify(gradeProto))}`;
    if (await this.AssetExist(ctx, id)) {
      throw new Error(`Could not create grade with id: ${id}, grade with that id already exists` );
    }
    const newGrade: Grade = {  ID: id, ...gradeProto};
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(newGrade)));
    console.info('created grade', newGrade);
    return newGrade;
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

  @Transaction(false)
  public async GetSubjectGrades(ctx: Context, subjectID: string): Promise<Grade[]> {
    assertUserRole(ctx, 'teacher');

    const subjectHash = getSubjectHash(subjectID);
    const grades: Grade[] = [];

    if (!await this.AssetExist(ctx, subjectID)) {
      throw new Error(`Subject with id ${subjectID} does not exist` );
    }

    await iterateOverState<Grade>(ctx, `grade.${subjectHash}.`, `grade.${subjectHash}/`, (grade: Grade) => {
        grades.push(grade);
    });

    return grades;
  }

  @Transaction(false)
  public async GetGrades(ctx: Context, subjectID: string): Promise<Grade[]> {
    assertUserRole(ctx, 'teacher');

    const username = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const subjectHash = subjectID.split('.').length > 1 ? subjectID.split('.')[1] : '';
    const grades: Grade[] = [];

    await iterateOverState<Grade>(ctx, `grade.${subjectHash}.`, `grade.${subjectHash}/`, (grade: Grade) => {
      if (grade.issuer === username) {
        grades.push(grade);
      }
    });

    return grades;
  }

  private async AssetExist(ctx: Context, id: string): Promise<boolean> {
    const state = await ctx.stub.getState(id);
    console.info('AssetExist', id, state.length);
    return state.length > 0;
  }

  private async validateNewGrade(ctx: Context, subjectID: string, studentName: string) {
    if (await this.AssetExist(ctx, subjectID)) {
      const subject = await getFromState<Subject>(ctx, subjectID);
      const student = subject?.students.find((value) => value === studentName);
      if (!student) {
        throw new Error(`Student does not belong to subject` );
      }
    } else {
      throw new Error(`Subject with id ${subjectID} does not exist` );

    }
  }
}
