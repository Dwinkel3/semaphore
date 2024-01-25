import { formatBytes32String } from "@ethersproject/strings"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { getCurveFromName } from "ffjavascript"
import { SemaphoreProof, generateProof, packPoints, unpackPoints, verifyProof } from "../src"

describe("Proof", () => {
    const treeDepth = 10

    const message = formatBytes32String("Hello world")
    const scope = formatBytes32String("Scope")

    const identity = new Identity(42)

    let fullProof: SemaphoreProof
    let curve: any

    beforeAll(async () => {
        curve = await getCurveFromName("bn128")
    })

    afterAll(async () => {
        await curve.terminate()
    })

    describe("# generateProof", () => {
        it("Should not generate a Semaphore proof if the tree depth is not supported", async () => {
            const group = new Group([BigInt(1), BigInt(2), identity.commitment])

            const fun = () => generateProof(identity, group, message, scope, 13)

            await expect(fun).rejects.toThrow("tree depth must be")
        })

        it("Should not generate Semaphore proofs if the identity is not part of the group", async () => {
            const group = new Group([BigInt(1), BigInt(2)])

            const fun = () => generateProof(identity, group, message, scope, treeDepth)

            await expect(fun).rejects.toThrow("does not exist")
        })

        it("Should generate a Semaphore proof", async () => {
            const group = new Group([BigInt(1), BigInt(2), identity.commitment])

            fullProof = await generateProof(identity, group, message, scope, treeDepth)

            expect(typeof fullProof).toBe("object")
            expect(fullProof.merkleTreeRoot).toBe(group.root)
        }, 20000)

        it("Should generate a Semaphore proof passing a Merkle proof instead of a group", async () => {
            const group = new Group([BigInt(1), BigInt(2), identity.commitment])

            fullProof = await generateProof(identity, group.generateMerkleProof(2), message, scope, treeDepth)

            expect(typeof fullProof).toBe("object")
            expect(fullProof.merkleTreeRoot).toBe(group.root)
        }, 20000)
    })

    describe("# verifyProof", () => {
        it("Should not verify a Semaphore proof if the tree depth is not supported", async () => {
            const fun = () => verifyProof({ ...fullProof, merkleTreeDepth: 40 })

            await expect(fun).rejects.toThrow("tree depth must be")
        })

        it("Should verify a Semaphore proof", async () => {
            const response = await verifyProof(fullProof)

            expect(response).toBe(true)
        })
    })

    describe("# packProof/unpackProof", () => {
        it("Should return a packed proof", async () => {
            const originalProof = unpackPoints(fullProof.points)
            const proof = packPoints(originalProof)

            expect(proof).toStrictEqual(fullProof.points)
        })
    })
})