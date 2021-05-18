import { Context, Contract, Info, Transaction } from 'fabric-contract-api';

@Info({ title: 'Identity', description: 'Smart contract for managing identity' })
export class IdentityContract extends Contract {
  @Transaction(false)
  public GetRole(ctx: Context): string {
    return ctx.clientIdentity.getAttributeValue('role');
  }
}
