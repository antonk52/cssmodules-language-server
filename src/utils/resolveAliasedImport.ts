import fs from 'fs';
import path from 'path';

import {lilconfigSync} from 'lilconfig';

const validate = {
    string: (x: unknown): x is string => typeof x === 'string',
    tsconfigPaths: (x: unknown): x is TsconfigPaths => {
        if (x === undefined || x === null) {
            return true;
        }

        if (typeof x !== 'object' || x == null || Array.isArray(x)) {
            return false;
        }

        const paths = x as Record<string, unknown>;

        const isValid = Object.values(paths).every(value => {
            return (
                Array.isArray(value) &&
                value.length > 0 &&
                value.every(validate.string)
            );
        });

        return isValid;
    },
};

type TsconfigPaths = null | undefined | Record<string, string[]>;

/**
 * Attempts to resolve aliased file paths using tsconfig or jsconfig
 *
 * returns null if paths could not be resolved, absolute filepath otherwise
 * @see https://www.typescriptlang.org/tsconfig#paths
 */
export const resolveAliasedImport = ({
    location,
    importFilepath,
}: {
    /**
     * direcotry where the file with import is located
     * @example "/Users/foo/project/components/Button"
     */
    location: string;
    /**
     *
     * @example "@/utils/style.module.css"
     */
    importFilepath: string;
}): string | null => {
    const searcher = lilconfigSync('', {
        searchPlaces: ['tsconfig.json', 'jsconfig.json'],
    });
    const config = searcher.search(location);

    if (config == null) {
        return null;
    }

    const paths: unknown = config.config?.compilerOptions?.paths;
    const baseUrl: unknown = config.config?.compilerOptions?.baseUrl;

    const configLocation = path.dirname(config.filepath);

    if (!validate.string(baseUrl)) {
        return null;
    }

    if (!validate.tsconfigPaths(paths)) {
        return null;
    }

    for (const alias in paths) {
        const aliasRe = new RegExp(alias.replace('*', '(.+)'), '');

        const aliasMatch = importFilepath.match(aliasRe);

        if (aliasMatch == null) continue;

        for (const potentialAliasLocation of paths[alias]) {
            const resolvedFileLocation = path.resolve(
                configLocation,
                baseUrl,
                potentialAliasLocation
                    // "./utils/*" -> "./utils/style.module.css"
                    .replace('*', aliasMatch[1]),
            );

            if (!fs.existsSync(resolvedFileLocation)) continue;

            return resolvedFileLocation;
        }
    }

    // try to just use the baseUrl to resolve imports
    // if not paths matched, still is a valid import
    const resolvedFileLocation = path.resolve(
        configLocation,
        baseUrl,
        importFilepath,
    );

    if (fs.existsSync(resolvedFileLocation)) {
        return resolvedFileLocation;
    }

    return null;
};
