import { CompiledContract } from '@midnight-ntwrk/compact-js';
export function createCompiledContract(tag, ContractClass, witnesses, assetsPath) {
    return CompiledContract.make(tag, ContractClass).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets(assetsPath));
}
//# sourceMappingURL=utils.js.map