// Stub backend — this is a static-only project with no Motoko canister.
// These stubs satisfy TypeScript imports from template scaffolding.

import { HttpAgent } from "@icp-sdk/core/agent";

export interface backendInterface {
  [key: string]: unknown;
}

export interface CreateActorOptions {
  agentOptions?: ConstructorParameters<typeof HttpAgent>[0];
}

export class ExternalBlob {
  static fromURL(_url: string): ExternalBlob {
    return new ExternalBlob();
  }
  async getBytes(): Promise<Uint8Array> {
    return new Uint8Array();
  }
  onProgress?: (_progress: number) => void;
}

export function createActor(
  _canisterId: string,
  _uploadFile: (_file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (_bytes: Uint8Array) => Promise<ExternalBlob>,
  _options?: CreateActorOptions,
): Promise<backendInterface> {
  return Promise.resolve({});
}
