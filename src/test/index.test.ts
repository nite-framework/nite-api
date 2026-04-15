import { beforeEach, describe, expect, it, vi } from "vitest";
import { of, firstValueFrom } from "rxjs";

const { deployContractMock, findDeployedContractMock } = vi.hoisted(() => ({
    deployContractMock: vi.fn(),
    findDeployedContractMock: vi.fn(),
}));
vi.mock("@midnight-ntwrk/midnight-js/contracts", () => ({
    deployContract: deployContractMock,
    findDeployedContract: findDeployedContractMock,
}));

import { DynamicContractAPI } from "../index.js";

describe("DynamicContractAPI", () => {
    const logger = {
        info: vi.fn(),
        trace: vi.fn(),
    };

    const publicState = { some: "public-state" };
    const privateState = { some: "private-state" };

    const providers = {
        publicDataProvider: {
            contractStateObservable: vi.fn(() => of(publicState)),
        },
        privateStateProvider: {
            get: vi.fn(async () => privateState),
        },
    } as any;

    const compiledContract = {} as any;

    const foundContract = {
        deployTxData: {
            public: {
                contractAddress: "addr_123",
                txHash: "tx_123",
            },
        },
        callTx: {
            increment: vi.fn((amount: number) => ({ ok: true, amount })),
            ping: vi.fn(() => ({ ok: true })),
        },
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        deployContractMock.mockResolvedValue(foundContract);
        findDeployedContractMock.mockResolvedValue(foundContract);
    });

    it("deploy() calls deployContract and exposes the deployed address", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
            logger: logger as any,
        });

        expect(deployContractMock).toHaveBeenCalledWith(providers, {
            compiledContract,
        });
        expect(api.deployedContractAddress).toBe("addr_123");
        expect(logger.info).toHaveBeenCalledWith({
            message: "Contract deployed",
            contractAddress: "addr_123",
            txHash: "tx_123",
        });
    });

    it("deploy() includes private state when provided", async () => {
        await DynamicContractAPI.deploy({
            providers,
            compiledContract,
            privateStateId: "ps_1",
            initialPrivateState: privateState,
            args: ["init-arg"],
        } as any);

        expect(deployContractMock).toHaveBeenCalledWith(providers, {
            compiledContract,
            privateStateId: "ps_1",
            initialPrivateState: privateState,
            args: ["init-arg"],
        });
    });

    it("join() calls findDeployedContract with the contract address", async () => {
        const api = await DynamicContractAPI.join({
            providers,
            compiledContract,
            contractAddress: "addr_123",
            logger: logger as any,
        });

        expect(findDeployedContractMock).toHaveBeenCalledWith(providers, {
            compiledContract,
            contractAddress: "addr_123",
        });
        expect(api.deployedContractAddress).toBe("addr_123");
        expect(logger.info).toHaveBeenCalledWith({
            message: "Contract joined",
            contractAddress: "addr_123",
        });
    });

    it("callTx() forwards to the underlying contract circuit", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
        });

        const callTx = api.callTx.bind(api) as (circuitName: string, ...args: any[]) => unknown;
        const result = callTx("increment", 5);

        expect(foundContract.callTx.increment).toHaveBeenCalledWith(5);
        expect(result).toEqual({ ok: true, amount: 5 });
    });

    it("callTx() throws for an unknown circuit", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
        });

        const callTx = api.callTx.bind(api) as (circuitName: string, ...args: any[]) => unknown;

        expect(() => callTx("missing")).toThrow(
            "Unknown callTx circuit: missing"
        );
    });

    it("callTx() supports circuits without arguments", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
        });

        const callTx = api.callTx.bind(api) as (circuitName: string, ...args: any[]) => unknown;
        const result = callTx("ping");

        expect(foundContract.callTx.ping).toHaveBeenCalledWith();
        expect(result).toEqual({ ok: true });
    });

    it("contractState emits public and private state together", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
            privateStateId: "ps_1",
            logger: logger as any,
        } as any);

        const state = await firstValueFrom(api.contractState);

        expect(providers.publicDataProvider.contractStateObservable).toHaveBeenCalledWith(
            "addr_123",
            { type: "all" }
        );
        expect(providers.privateStateProvider.get).toHaveBeenCalledWith("ps_1");
        expect(state).toEqual([publicState, privateState]);
        expect(logger.trace).toHaveBeenCalledWith({ contractState: publicState });
    });

    it("contractState emits null private state when no privateStateId is provided", async () => {
        const api = await DynamicContractAPI.deploy({
            providers,
            compiledContract,
        });

        const state = await firstValueFrom(api.contractState);

        expect(providers.privateStateProvider.get).not.toHaveBeenCalled();
        expect(state).toEqual([publicState, null]);
    });
});
