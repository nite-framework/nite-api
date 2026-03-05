import { CompiledContract, type Contract } from '@midnight-ntwrk/compact-js';

export type ContractCtor<TContract extends Contract<any, any>> = new (...args: any[]) => TContract;

export function createCompiledContract<TContract extends Contract<any, any>>(
  tag: string,
  ContractClass: ContractCtor<TContract>,
  witnesses: Contract.Witnesses<TContract>,
  assetsPath: string
): CompiledContract.CompiledContract<TContract, Contract.Witnesses<TContract>> {
  return (CompiledContract.make(tag, ContractClass as any) as any).pipe(
    (CompiledContract.withWitnesses as any)(witnesses),
    (CompiledContract.withCompiledFileAssets as any)(assetsPath)
  ) as CompiledContract.CompiledContract<TContract, Contract.Witnesses<TContract>>;
}
