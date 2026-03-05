import { type Contract } from "@midnight-ntwrk/compact-js";

export type ContractCtor<TContract extends Contract<any, any>> = new (...args: any[]) => TContract;