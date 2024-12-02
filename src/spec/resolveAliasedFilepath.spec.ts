import {existsSync} from 'fs';
import {lilconfigSync} from 'lilconfig';
import {type Mock, describe, expect, it, vi} from 'vitest';
import {resolveAliasedImport} from '../utils/resolveAliasedImport';
import {resolveJson5File} from '../utils/resolveJson5File';

vi.mock('lilconfig', async () => {
    const actual: typeof import('lilconfig') =
        await vi.importActual('lilconfig');
    return {
        ...actual,
        lilconfigSync: vi.fn(),
    };
});

vi.mock('../utils/resolveJson5File', async () => {
    return {
        resolveJson5File: vi.fn(),
    };
});

vi.mock('fs', async () => {
    const actual: typeof import('fs') = await vi.importActual('fs');
    const existsSync = vi.fn();
    return {
        ...actual,
        existsSync,
        default: {
            // @ts-ignore
            ...actual.default,
            existsSync,
        },
    };
});

describe('utils: resolveAliasedFilepath', () => {
    it('returns null if config does not exist', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => null,
        });
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns null when baseUrl is not set in the config', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        // missing "baseUrl"
                        paths: {},
                    },
                },
                filepath: '/path/to/config',
            }),
        });
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns null when "paths" is not set in the config and path does not match', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        baseUrl: './',
                        // missing "paths"
                    },
                },
                filepath: '/path/to/config',
            }),
        });
        (existsSync as Mock).mockReturnValue(false);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns resolved filepath when "paths" is not set in the config, and file exists', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        baseUrl: './',
                        // missing "paths"
                    },
                },
                filepath: '/path/to/tsconfig.json',
            }),
        });
        (existsSync as Mock).mockReturnValue(true);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: 'src/styles/file.css',
        });
        const expected = '/path/to/src/styles/file.css';

        expect(result).toEqual(expected);
    });

    it('returns baseUrl-mapped path when no alias matched import path', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        baseUrl: './',
                        paths: {
                            '@bar/*': ['./bar/*'],
                        },
                    },
                },
                filepath: '/path/to/config',
            }),
        });
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@foo',
        });
        const expected = '/path/to/@foo';

        expect(result).toEqual(expected);
    });

    it('returns null when no files matching alias were found', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        baseUrl: './',
                        paths: {
                            '@bar/*': ['./bar/*'],
                        },
                    },
                },
                filepath: '/path/to/config',
            }),
        });
        (existsSync as Mock).mockReturnValue(false);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@bar/file.css',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns resolved filepath when matched alias file is found', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {
                        baseUrl: './',
                        paths: {
                            '@bar/*': ['./bar/*'],
                        },
                    },
                },
                filepath: '/path/to/tsconfig.json',
            }),
        });
        (existsSync as Mock).mockReturnValue(true);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@bar/file.css',
        });
        const expected = '/path/to/bar/file.css';

        expect(result).toEqual(expected);
    });

    it('searches for paths in parent configs when extends is set', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {},
                    extends: '../tsconfig.base.json',
                },
                filepath: '/root/module/tsconfig.json',
            }),
        });
        (existsSync as Mock).mockReturnValue(true);
        (resolveJson5File as Mock).mockReturnValueOnce({
            config: {
                compilerOptions: {
                    baseUrl: './',
                    paths: {
                        '@other/*': ['./other/*'],
                    },
                },
            },
            filepath: '/root/tsconfig.base.json',
        });
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@other/file.css',
        });
        const expected = '/root/other/file.css';

        expect(result).toEqual(expected);
    });

    it('handles infinite extends loops', () => {
        (lilconfigSync as Mock).mockReturnValueOnce({
            search: () => ({
                config: {
                    compilerOptions: {},
                    extends: '../tsconfig.base.json',
                },
                filepath: '/root/module/tsconfig.json',
            }),
        });
        (existsSync as Mock).mockReturnValue(true);
        (resolveJson5File as Mock).mockReturnValue({
            config: {
                compilerOptions: {},
                extends: './tsconfig.base.json',
            },
            filepath: '/root/tsconfig.base.json',
        });
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@bar/file.css',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });
});
