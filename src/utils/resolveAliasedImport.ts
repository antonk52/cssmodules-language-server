import fs from 'fs';
import path from 'path';

import {lilconfigSync} from 'lilconfig';

const validate = {
    string: (x: unknown): x is string => typeof x === 'string',
    tsconfigPaths: (x: unknown): x is TsconfigPaths => {
        if (typeof x !== 'object' || x == null || Array.isArray(x)) {
            return false;
        }

        for (const key in x) {
            const value =
                // @ts-expect-error: here "key" can be used to index object
                x[key];
            if (
                !Array.isArray(value) &&
                value.length > 0 &&
                !value.every(validate.string)
            ) {
                return false;
            }
        }

        return true;
    },
};

type TsconfigPaths = Record<string, string[]>;

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

    const paths = config.config?.compilerOptions?.paths as void | TsconfigPaths;
    const baseUrl = config.config?.compilerOptions?.baseUrl as void | string;
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

    return null;
};
