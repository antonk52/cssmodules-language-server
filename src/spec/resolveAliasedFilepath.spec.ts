import {lilconfigSync} from 'lilconfig';
import {existsSync} from 'fs';
import {resolveAliasedImport} from '../utils/resolveAliasedImport';

jest.mock('lilconfig', () => ({
    lilconfigSync: jest.fn(),
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
}));

describe('utils: resolveAliaedFilepath', () => {
    it('returns null if config does not exist', () => {
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (existsSync as jest.Mock).mockReturnValue(false);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns resolved filepath when "paths" is not set in the config, and file exists', () => {
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (existsSync as jest.Mock).mockReturnValue(true);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: 'src/styles/file.css',
        });
        const expected = '/path/to/src/styles/file.css';

        expect(result).toEqual(expected);
    });

    it('returns baseUrl-mapped path when no alias matched import path', () => {
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (existsSync as jest.Mock).mockReturnValue(false);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@bar/file.css',
        });
        const expected = null;

        expect(result).toEqual(expected);
    });

    it('returns resolved filepath when matched alias file is found', () => {
        (lilconfigSync as jest.Mock).mockReturnValueOnce({
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
        (existsSync as jest.Mock).mockReturnValue(true);
        const result = resolveAliasedImport({
            location: '',
            importFilepath: '@bar/file.css',
        });
        const expected = '/path/to/bar/file.css';

        expect(result).toEqual(expected);
    });
});
