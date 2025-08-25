declare module 'tree-sitter-typescript' {
    const typescript: any;
    const javascript: any;
    export { typescript, javascript };
}

declare module 'tree-sitter-python' {
    const python: any;
    export = python;
}

declare module 'tree-sitter-c-sharp' {
    const csharp: any;
    export = csharp;
}

declare module 'glob' {
    interface GlobOptions {
        cwd?: string;
        absolute?: boolean;
        nodir?: boolean;
        dot?: boolean;
    }

    function glob(pattern: string, options: GlobOptions, callback: (err: Error | null, matches: string[]) => void): void;

    export { glob, GlobOptions };
}
