import { deployContract, findDeployedContract, } from "@midnight-ntwrk/midnight-js-contracts";
import { combineLatest, concat, from, map, tap } from "rxjs";
export class DynamicContractAPI {
    providers;
    compiledContract;
    deployedContract;
    privateStateId;
    deployedContractAddress;
    contractState;
    constructor(providers, compiledContract, deployedContract, privateStateId, logger) {
        this.providers = providers;
        this.compiledContract = compiledContract;
        this.deployedContract = deployedContract;
        this.privateStateId = privateStateId;
        this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
        this.contractState = combineLatest([
            this.providers.publicDataProvider
                .contractStateObservable(this.deployedContractAddress, { type: "all" })
                .pipe(map((state) => state), tap((state) => {
                logger?.trace({ contractState: state });
            })),
            this.privateStateId
                ? concat(from(this.providers.privateStateProvider.get(this.privateStateId)))
                : from(Promise.resolve(null)),
        ]);
    }
    callTx(circuitName, ...args) {
        const circuit = this.deployedContract.callTx[circuitName];
        if (typeof circuit !== "function") {
            throw new Error(`Unknown callTx circuit: ${String(circuitName)}`);
        }
        return circuit(...args);
    }
    static async deploy(options) {
        const { providers, compiledContract, privateStateId, initialPrivateState, args, logger } = options;
        const deployed = (privateStateId && initialPrivateState !== undefined
            ? await deployContract(providers, {
                compiledContract,
                privateStateId,
                initialPrivateState,
                ...(args ? { args } : {}),
            })
            : await deployContract(providers, {
                compiledContract,
                ...(args ? { args } : {}),
            }));
        logger?.info({
            message: "Contract deployed",
            contractAddress: deployed.deployTxData.public.contractAddress,
            txHash: deployed.deployTxData.public.txHash,
        });
        return new DynamicContractAPI(providers, compiledContract, deployed, privateStateId, logger);
    }
    static async join(options) {
        const { providers, compiledContract, contractAddress, privateStateId, initialPrivateState, logger, } = options;
        const deployed = (privateStateId
            ? await findDeployedContract(providers, {
                compiledContract,
                contractAddress,
                privateStateId,
                ...(initialPrivateState !== undefined ? { initialPrivateState } : {}),
            })
            : await findDeployedContract(providers, {
                compiledContract,
                contractAddress,
            }));
        logger?.info({
            message: "Contract joined",
            contractAddress: deployed.deployTxData.public.contractAddress,
        });
        return new DynamicContractAPI(providers, compiledContract, deployed, privateStateId, logger);
    }
}
export * as utils from "./utils.js";
//# sourceMappingURL=index.js.map