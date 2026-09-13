declare namespace Deno {
  export interface ServeOptions {
    port?: number
    hostname?: string
  }
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): void
  export const env: {
    get(key: string): string | undefined
    set(key: string, value: string): void
    toObject(): Record<string, string>
  }
}

declare module 'https://*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any
  export default content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createClient: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const serve: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const GoogleGenAI: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Anthropic: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const OpenAI: any
}
