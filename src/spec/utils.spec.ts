import {
    filePathToClassnameDict,
    findImportPath,
    getTransformer,
} from '../utils';
import * as path from 'path';

describe('filePathToClassnameDict', () => {
    describe('CSS', () => {
        it('gets a dictionory of classnames and their location', async () => {
            const filepath = path.join(__dirname, 'styles', 'regular.css');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.single': {
                    line: 1,
                    column: 1,
                },
                '.one': {
                    line: 5,
                    column: 1,
                },
                '.two': {
                    line: 5,
                    column: 5,
                },
                '.block--element__mod': {
                    line: 9,
                    column: 1,
                },
                '.m-9': {
                    line: 13,
                    column: 1,
                },
                '.💩': {
                    column: 1,
                    line: 17,
                },
                '.🔥🚒': {
                    column: 1,
                    line: 21,
                },
                '.🤢-_-😷': {
                    column: 1,
                    line: 25,
                },
                '.inMedia': {
                    column: 5,
                    line: 30,
                },
            };

            expect(result).toEqual(expected);
        });

        it('gets a dictionory of nested classnames', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.css');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.single': {
                    line: 1,
                    column: 1,
                },
                '.parent': {
                    line: 5,
                    column: 1,
                },
                '.child': {
                    line: 6,
                    // TODO: targets the first element from the selector
                    // instead of the actual classname
                    column: 5,
                },
                '.parent--aa': {
                    line: 25,
                    column: 5,
                },
                '.parent--bb': {
                    line: 25,
                    // TODO: same errro as for `.child`
                    column: 5,
                },
                '.parent--mod': {
                    line: 10,
                    column: 5,
                },
                '.parent--mod--addon': {
                    line: 13,
                    column: 9,
                },
                '.inMedia': {
                    line: 32,
                    column: 5,
                },
                '.inMedia__mod': {
                    line: 35,
                    column: 9,
                },
            };

            expect(result).toEqual(expected);
        });

        // TODO
        it.skip('multiple nested classnames in a single selector', async () => {
            const filepath = path.join(
                __dirname,
                'styles',
                'second-nested-selector.css',
            );
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.parent': {
                    line: 1,
                    column: 1,
                },
                '.child': {
                    line: 2,
                    // TODO: targets the first element from the selector
                    // instead of the actual classname
                    column: 5,
                },
                '.parent--alt': {
                    line: 7,
                    column: 5,
                },
                '.parent--mod': {
                    line: 6,
                    column: 5,
                },
                '.parent--mod--addon': {
                    line: 16,
                    column: 9,
                },
            };

            expect(result).toEqual(expected);
        });
    });

    describe('LESS', () => {
        it('gets a dictionory of nested classnames from less files', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.less');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.single': {
                    line: 10,
                    column: 1,
                },
                '.button': {
                    column: 1,
                    line: 14,
                },
                '.button-cancel': {
                    column: 5,
                    line: 18,
                },
                '.button-custom': {
                    column: 5,
                    line: 22,
                },
                '.button-ok': {
                    column: 5,
                    line: 15,
                },
                '.class': {
                    column: 1,
                    line: 52,
                },
                '.container': {
                    column: 1,
                    line: 121,
                },
                '.element': {
                    column: 5,
                    line: 74,
                },
                '.inner': {
                    column: 5,
                    line: 98,
                },
                '.inside-the-css-guard': {
                    column: 5,
                    line: 105,
                },
                '.link': {
                    column: 1,
                    line: 27,
                },
                '.linkish': {
                    column: 5,
                    line: 40,
                },
                '.math': {
                    column: 1,
                    line: 45,
                },
                '.mixin': {
                    column: 1,
                    line: 88,
                },
                '.my-optional-style': {
                    column: 1,
                    line: 104,
                },
                '.myclass': {
                    column: 1,
                    line: 91,
                },
                '.section': {
                    column: 1,
                    line: 71,
                },
                '.inMedia': {
                    column: 5,
                    line: 112,
                },
                '.inMedia__mod': {
                    column: 9,
                    line: 115,
                },
                '.withinMedia': {
                    column: 9,
                    line: 123,
                },
                '.withinMedia__mod': {
                    column: 13,
                    line: 126,
                },
            };

            expect(result).toEqual(expected);
        });
    });

    describe('SCSS', () => {
        it('gets a dictionory of nested classnames for `false` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.accordion': {
                    column: 1,
                    line: 69,
                },
                '.accordion__copy': {
                    column: 5,
                    line: 76,
                },
                '.accordion__copy--open': {
                    column: 9,
                    line: 84,
                },
                '.accordion__sm': {
                    column: 9,
                    line: 90,
                },
                '.accordion__sm--shrink': {
                    column: 13,
                    line: 93,
                },
                '.alert': {
                    column: 1,
                    line: 58,
                },
                '.pulse': {
                    column: 1,
                    line: 46,
                },
                '.inMedia': {
                    column: 5,
                    line: 101,
                },
                '.inMedia__mod': {
                    column: 9,
                    line: 104,
                },
            };

            expect(result).toEqual(expected);
        });

        it('gets a dictionory of nested classnames for `true` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(true),
            );
            const expected = {
                '.accordion': {
                    column: 1,
                    line: 69,
                },
                '.accordionCopy': {
                    column: 5,
                    line: 76,
                },
                '.accordionCopyOpen': {
                    column: 9,
                    line: 84,
                },
                '.accordionSm': {
                    column: 9,
                    line: 90,
                },
                '.accordionSmShrink': {
                    column: 13,
                    line: 93,
                },
                '.alert': {
                    column: 1,
                    line: 58,
                },
                '.pulse': {
                    column: 1,
                    line: 46,
                },
                '.inMedia': {
                    column: 5,
                    line: 101,
                },
                '.inMediaMod': {
                    column: 9,
                    line: 104,
                },
            };

            expect(result).toEqual(expected);
        });

        it('gets a dictionory of nested classnames for `"dashes"` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer('dashes'),
            );
            const expected = {
                '.accordion': {
                    column: 1,
                    line: 69,
                },
                '.accordion__copy': {
                    column: 5,
                    line: 76,
                },
                '.accordion__copyOpen': {
                    column: 9,
                    line: 84,
                },
                '.accordion__sm': {
                    column: 9,
                    line: 90,
                },
                '.accordion__smShrink': {
                    column: 13,
                    line: 93,
                },
                '.alert': {
                    column: 1,
                    line: 58,
                },
                '.pulse': {
                    column: 1,
                    line: 46,
                },
                '.inMedia': {
                    column: 5,
                    line: 101,
                },
                '.inMedia__mod': {
                    column: 9,
                    line: 104,
                },
            };

            expect(result).toEqual(expected);
        });
    });

    describe('SASS', () => {
        it('gets a dictionory of nested classnames', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.sass');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            const expected = {
                '.accordion': {
                    column: 1,
                    line: 55,
                },
                '.accordion__copy': {
                    column: 5,
                    line: 62,
                },
                '.accordion__copy--open': {
                    column: 9,
                    line: 70,
                },
                '.alert': {
                    column: 1,
                    line: 48,
                },
                '.pulse': {
                    column: 1,
                    line: 35,
                },
                '.inMedia': {
                    column: 5,
                    line: 74,
                },
                '.inMedia__mod': {
                    column: 9,
                    line: 77,
                },
            };

            expect(result).toEqual(expected);
        });
    });
});

const fileContent = `
import React from 'react'

import css from './style.css'
import cssm from './style.module.css'
import style from './style.css'
import styles from './styles.css'
import lCss from './styles.less'
import sCss from './styles.scss'
import sass from './styles.sass'
import styl from './styles.styl'

const rCss = require('./style.css')
const rStyle = require('./style.css')
const rStyles = require('./styles.css')
const rLCss = require('./styles.less')
const rSCss = require('./styles.scss')
const rSass = require('./styles.sass')
const rStyl = require('./styles.styl')
`.trim();

describe('findImportPath', () => {
    const dirPath = '/User/me/project/Component';

    [
        ['css', path.join(dirPath, 'style.css')],
        ['cssm', path.join(dirPath, 'style.module.css')],
        ['style', path.join(dirPath, 'style.css')],
        ['styles', path.join(dirPath, 'styles.css')],
        ['lCss', path.join(dirPath, 'styles.less')],
        ['sCss', path.join(dirPath, 'styles.scss')],
        ['sass', path.join(dirPath, 'styles.sass')],
        ['styl', path.join(dirPath, 'styles.styl')],

        ['rCss', path.join(dirPath, './style.css')],
        ['rStyle', path.join(dirPath, './style.css')],
        ['rStyles', path.join(dirPath, './styles.css')],
        ['rLCss', path.join(dirPath, './styles.less')],
        ['rSCss', path.join(dirPath, './styles.scss')],
        ['rSass', path.join(dirPath, './styles.sass')],
        ['rStyl', path.join(dirPath, './styles.styl')],
    ].forEach(([importName, expected]) =>
        it(`finds the correct import path for ${importName}`, () => {
            const result = findImportPath(fileContent, importName, dirPath);
            expect(result).toBe(expected);
        }),
    );

    it('returns an empty string when there is no import', () => {
        const simpleComponentFile = [
            "import React from 'react'",
            'export () => <h1>hello world</h1>',
        ].join('\n');

        const result = findImportPath(simpleComponentFile, 'css', dirPath);
        const expected = '';

        expect(result).toEqual(expected);
    });
});

describe('getTransformer', () => {
    describe('for `true` setting', () => {
        const transformer = getTransformer(true);
        it('classic BEM classnames get camelified', () => {
            const input = '.el__block--mod';
            const result = transformer(input);
            const expected = '.elBlockMod';

            expect(result).toEqual(expected);
        });
        it('emojis stay the same', () => {
            const input = '.✌️';
            const result = transformer(input);
            const expected = '.✌️';

            expect(result).toEqual(expected);
        });
    });
    describe('for `dashes` setting', () => {
        const transformer = getTransformer('dashes');
        it('only dashes in BEM classnames get camelified', () => {
            const input = '.el__block--mod';
            const result = transformer(input);
            const expected = '.el__blockMod';

            expect(result).toEqual(expected);
        });
        it('emojis stay the same', () => {
            const input = '.✌️';
            const result = transformer(input);
            const expected = '.✌️';

            expect(result).toEqual(expected);
        });
    });
    describe('for `false` setting', () => {
        const transformer = getTransformer(false);

        it('classic BEM classnames get camelified', () => {
            const input = '.el__block--mod';
            const result = transformer(input);

            expect(result).toEqual(input);
        });
        it('emojis stay the same', () => {
            const input = '.✌️';
            const result = transformer(input);

            expect(result).toEqual(input);
        });
    });
});
