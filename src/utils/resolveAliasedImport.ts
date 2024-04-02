import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

import {lilconfigSync} from 'lilconfig';

const validate = {
    string: (x: unknown): x is string => typeof x === 'string',
    tsconfigPaths: (x: unknown): x is TsconfigPaths => {
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
        loaders: {
            '.json': (_, content) => JSON5.parse(content),
        },
    });
    const config = searcher.search(location);

    if (config == null) {
        return null;
    }

    const paths: unknown = config.config?.compilerOptions?.paths;

    const potentialBaseUrl: unknown = config.config?.compilerOptions?.baseUrl;

    const configLocation = path.dirname(config.filepath);

    if (validate.tsconfigPaths(paths)) {
        const baseUrl = validate.string(potentialBaseUrl)
            ? potentialBaseUrl
            : '.';

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
    }

    // if paths is defined, but no paths match
    // then baseUrl will not fallback to "."
    // if not using paths to find an alias, baseUrl must be defined
    // so here we only try and resolve the file if baseUrl is explcitly set and valid
    // i.e. if no baseUrl is provided
    // then no imports relative to baseUrl on its own are allowed, only relative to paths
    if (validate.string(potentialBaseUrl)) {
        const resolvedFileLocation = path.resolve(
            configLocation,
            potentialBaseUrl,
            importFilepath,
        );

        if (fs.existsSync(resolvedFileLocation)) {
            return resolvedFileLocation;
        }
    }

    return null;
};
