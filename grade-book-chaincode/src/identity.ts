import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { UserData } from './models/user-data';
import { assertUserRole } from './utils';

const collectionName = 'user-data';

@Info({ title: 'Identity', description: 'Smart contract for managing identity' })
export class IdentityContract extends Contract {
  @Transaction(false)
  public GetRole(ctx: Context): string {
    return ctx.clientIdentity.getAttributeValue('role');
  }

  @Transaction(true)
  public SetIdentityDetails(ctx: Context, login: string): void {
    assertUserRole(ctx, 'admin');

    const data = ctx.stub.getTransient().get('asset_properties');

    ctx.stub.putPrivateData(collectionName, login, data);
  }

  @Transaction(false)
  public async GetStudentsList(ctx: Context): Promise<string[]> {
    assertUserRole(ctx, 'teacher');

    const outcome = [];

    const iterator = ((await ctx.stub.getPrivateDataByRange(collectionName, '', '')) as any).iterator;
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      let record: UserData;
      try {
        record = JSON.parse(strValue);
        if (record.role === 'student') {
          outcome.push({ username: result.value.key, ...record });
        }
      } catch (err) {
        console.info('Error during parsing', err);
      }
      result = await iterator.next();
    }

    return outcome;
  }

  @Transaction(false)
  public async GetIdentityDetails(ctx: Context, login: string): Promise<UserData> {
    const requestingUser = ctx.clientIdentity.getAttributeValue('hf.EnrollmentID');
    const requestingRole = ctx.clientIdentity.getAttributeValue('role');

    let parsedData: UserData;
    try {
      const data = await ctx.stub.getPrivateData(collectionName, login);
      parsedData = JSON.parse(data.toString());
    } catch (err) {
      throw new Error(`Asset probably does not exist`);
    }

    if (login === requestingUser) {
      return parsedData;
    }

    if (parsedData.role !== 'teacher' && requestingRole === 'student') {
      throw new Error(`Unauthorized`);
    }

    return parsedData;
  }
}
