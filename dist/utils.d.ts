import { ContractCtor } from './common-types';
import { CompiledContract, type Contract } from '@midnight-ntwrk/compact-js';
export declare function createCompiledContract<TContract extends Contract<any, any>>(tag: string, ContractClass: ContractCtor<TContract>, witnesses: Contract.Witnesses<TContract>, assetsPath: string): CompiledContract.CompiledContract<TContract, Contract.Witnesses<TContract>>;
