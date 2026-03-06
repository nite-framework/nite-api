import { type CompiledContract, type Contract } from "@midnight-ntwrk/compact-js";
import { type ContractState } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  findDeployedContract,
  type FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { type MidnightProviders, type PrivateStateId } from "@midnight-ntwrk/midnight-js-types";
import { type Logger } from "pino";
import { combineLatest, concat, from, map, type Observable, tap } from "rxjs";


export type DynamicProviders<C extends Contract.Any, PSID extends PrivateStateId> = MidnightProviders<
  Contract.ImpureCircuitId<C>,
  PSID,
  Contract.PrivateState<C>
>;

type TxCallMap<C extends Contract.Any> = FoundContract<C>["callTx"];
type TxCircuitName<C extends Contract.Any> = Extract<keyof TxCallMap<C>, string>;
type TxCircuitFn<C extends Contract.Any, K extends TxCircuitName<C>> =
  TxCallMap<C>[K] extends (...args: infer A) => infer R ? (...args: A) => R : never;
type TxCircuitArgs<C extends Contract.Any, K extends TxCircuitName<C>> = Parameters<TxCircuitFn<C, K>>;
type TxCircuitReturn<C extends Contract.Any, K extends TxCircuitName<C>> = ReturnType<TxCircuitFn<C, K>>;


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


export class DynamicContractAPI<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId> {
  readonly deployedContractAddress: string;
  
  readonly contractState: Observable<[ContractState, Contract.PrivateState<C> | null]>;

  private constructor(
    public readonly providers: DynamicProviders<C, PSID>,
    public readonly compiledContract: CompiledContract.CompiledContract<C, any>,
    public readonly deployedContract: FoundContract<C>,
    public readonly privateStateId?: PSID,
    logger?: Logger
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    
    this.contractState = combineLatest([
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: "all" })
        .pipe(
          map((state) => state),
          tap((state) => {
            logger?.trace({ contractState: state });
          })
        ),
      this.privateStateId
        ? concat(from(this.providers.privateStateProvider.get(this.privateStateId)))
        : from(Promise.resolve(null)),
    ]);
  }

  callTx<K extends TxCircuitName<C>>(
    circuitName: K,
    ...args: TxCircuitArgs<C, K>
  ): TxCircuitReturn<C, K> {
    const circuit = this.deployedContract.callTx[circuitName] as TxCircuitFn<C, K> | undefined;
    if (typeof circuit !== "function") {
      throw new Error(`Unknown callTx circuit: ${String(circuitName)}`);
    }

    return circuit(...args) as TxCircuitReturn<C, K>;
  }

  static async deploy<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId>(
    options: DeployOptions<C, PSID>
  ): Promise<DynamicContractAPI<C, PSID>> {
    const { providers, compiledContract, privateStateId, initialPrivateState, args, logger } = options;

    const deployed = (privateStateId && initialPrivateState !== undefined
      ? await deployContract(providers as any, {
          compiledContract,
          privateStateId,
          initialPrivateState,
          ...(args ? { args } : {}),
        } as any)
      : await deployContract(providers as any, {
          compiledContract,
          ...(args ? { args } : {}),
        } as any)) as FoundContract<C>;

    logger?.info({
      message: "Contract deployed",
      contractAddress: deployed.deployTxData.public.contractAddress,
      txHash: deployed.deployTxData.public.txHash,
    });

    return new DynamicContractAPI<C, PSID>(
      providers,
      compiledContract,
      deployed,
      privateStateId,
      logger
    );
  }

  static async join<C extends Contract.Any, PSID extends PrivateStateId = PrivateStateId>(
    options: JoinOptions<C, PSID>
  ): Promise<DynamicContractAPI<C, PSID>> {
    const {
      providers,
      compiledContract,
      contractAddress,
      privateStateId,
      initialPrivateState,
      logger,
    } = options;

    const deployed = (privateStateId
      ? await findDeployedContract(providers as any, {
          compiledContract,
          contractAddress,
          privateStateId,
          ...(initialPrivateState !== undefined ? { initialPrivateState } : {}),
        } as any)
      : await findDeployedContract(providers as any, {
          compiledContract,
          contractAddress,
        } as any)) as FoundContract<C>;

    logger?.info({
      message: "Contract joined",
      contractAddress: deployed.deployTxData.public.contractAddress,
    });

    return new DynamicContractAPI<C, PSID>(
      providers,
      compiledContract,
      deployed,
      privateStateId,
      logger
    );
  }
}


export * as utils from "./utils.js";
