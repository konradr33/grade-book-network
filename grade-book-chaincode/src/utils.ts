import { createHash } from 'crypto';
import { Context } from 'fabric-contract-api';

export async function iterateOverState<T>(
  ctx: Context,
  startKey: string,
  endKey: string,
  callback: (a: T) => void,
): Promise<void> {
  const iterator = await ctx.stub.getStateByRange(startKey, endKey);
  let result = await iterator.next();
  while (!result.done) {
    const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
    let record: T;
    try {
      record = JSON.parse(strValue);
      callback(record);
    } catch (err) {
      console.info('Error during parsing', err);
    }
    result = await iterator.next();
  }
}

export function assertUserRole(ctx: Context, expectedRole: string): void {
  if (!ctx.clientIdentity.assertAttributeValue('role', expectedRole)) {
    throw new Error(`The user does not have the ${expectedRole} role`);
  }
}

export function getHexHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function getSubjectHash(subjectID: string): string {
  const splitSubject = subjectID.split('.');
  if (splitSubject.length > 1) {
    return splitSubject[1];
  } else {
    throw new Error(`Incorrect subject id ${subjectID}`);
  }
}

export function getAssetType(assetID: string): string {
  const splitSubject = assetID.split('.');
  if (splitSubject.length > 1) {
    return splitSubject[0];
  } else {
    throw new Error(`Incorrect id ${assetID}`);
  }
}

export async function getFromState<T>(ctx: Context, id: string): Promise<undefined | T> {
  const source = await ctx.stub.getState(id);
  if (source.length > 0) {
    return JSON.parse(source.toString()) as T;
  } else {
    return;
  }
}

export async function assetExist(ctx: Context, id: string): Promise<boolean> {
  const state = await ctx.stub.getState(id);
  return state.length > 0;
}

export function getUserFromGradeID(gradeID: string): string {
  const splitSubject = gradeID.split('.');
  if (splitSubject.length === 4) {
    return splitSubject[2];
  } else {
    throw new Error(`Incorrect grade id ${gradeID}`);
  }
}

export async function getHistory<T>(promiseOfIterator): Promise<T[]> {
  const history = [];

  for await (const res of promiseOfIterator) {
    history.push(JSON.parse(res.value.toString('utf8')));
  }

  return history;
}
