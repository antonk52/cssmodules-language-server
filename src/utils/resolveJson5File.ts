import fs from 'fs';
import JSON5 from 'json5';

import type {LilconfigResult} from 'lilconfig';

/**
 * Attempts to resolve the path to a json5 file using node.js resolution rules
 *
 * returns null if file could not be resolved, or if JSON5 parsing fails
 * @see https://www.typescriptlang.org/tsconfig/#extends
 */
export const resolveJson5File = ({
    path,
    base,
}: {
    /**
     * path to the json5 file
     * @example "../tsconfig.json"
     */
    path: string;
    /**
     * directory where the file with import is located
     * @example "/Users/foo/project/components"
     */
    base: string;
}): LilconfigResult => {
    try {
        const filepath = require.resolve(path, {paths: [base]});
        const content = fs.readFileSync(filepath, 'utf8');
        const isEmpty = content.trim() === '';
        const config = isEmpty ? {} : JSON5.parse(content);
        return {filepath, isEmpty, config};
    } catch (e) {
        return null;
    }
};
