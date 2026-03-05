import { type CompiledContract, type Contract } from "@midnight-ntwrk/compact-js";
import { type ContractState } from "@midnight-ntwrk/compact-runtime";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import { type MidnightProviders, type PrivateStateId } from "@midnight-ntwrk/midnight-js-types";
import { type Logger } from "pino";
import { type Observable } from "rxjs";
export type ContractCtor<TContract extends Contract<any, any>> = new (...args: any[]) => TContract;
export type DynamicProviders<C extends Contract.Any, PSID extends PrivateStateId> = MidnightProviders<Contract.ImpureCircuitId<C>, PSID, Contract.PrivateState<C>>;
type TxCallMap<C extends Contract.Any> = FoundContract<C>["callTx"];
type TxCircuitName<C extends Contract.Any> = Extract<keyof TxCallMap<C>, string>;
type TxCircuitFn<C extends Contract.Any, K extends TxCircuitName<C>> = TxCallMap<C>[K] extends (...args: infer A) => infer R ? (...args: A) => R : never;
type DeployOptions<C extends Contract.Any, PSID extends PrivateStateId> = {
    readonly providers: DynamicProviders<C, PSID>;
    readonly compiledContract: CompiledContract.CompiledContract<C, any>;
    readonly privateStateId?: PSID;
    readonly initialPrivateState?: Contract.PrivateState<C>;
    readonly args?: Contract.InitializeParameters<C>;
    readonly logger?: Logger;
};
type JoinOptions<C extends Contract.Any, PSID extends PrivateStateId> = {
    readonly providers: DynamicProviders<C, PSID>;
    readonly compiledContract: CompiledContract.CompiledContract<C, any>;
    readonly contractAddress: string;
    readonly privateStateId?: PSID;
    readonly initialPrivateState?: Contract.PrivateState<C>;
    readonly logger?: Logger;
};
export declare class DynamicContractAPI<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId> {
    readonly providers: DynamicProviders<C, PSID>;
    readonly compiledContract: CompiledContract.CompiledContract<C, any>;
    readonly deployedContract: FoundContract<C>;
    readonly privateStateId?: PSID | undefined;
    readonly deployedContractAddress: string;
    readonly contractState: Observable<[ContractState, Contract.PrivateState<C> | null]>;
    private constructor();
    callTx<K extends TxCircuitName<C>>(circuitName: K, ...args: Parameters<TxCircuitFn<C, K>>): ReturnType<TxCircuitFn<C, K>>;
    static deploy<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId>(options: DeployOptions<C, PSID>): Promise<DynamicContractAPI<C, PSID>>;
    static join<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId>(options: JoinOptions<C, PSID>): Promise<DynamicContractAPI<C, PSID>>;
}
export * as utils from "./utils.js";
