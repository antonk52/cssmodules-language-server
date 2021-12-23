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

            expect(result).toMatchSnapshot();
        });

        it('gets a dictionory of nested classnames', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.css');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );

            expect(result).toMatchSnapshot();
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

            expect(result).toMatchSnapshot();
        });
    });

    describe('LESS', () => {
        it('gets a dictionory of nested classnames from less files', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.less');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );

            expect(result).toMatchSnapshot();
        });
    });

    describe('SCSS', () => {
        it('gets a dictionory of nested classnames for `false` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );
            expect(result).toMatchSnapshot();
        });

        it('gets a dictionory of nested classnames for `true` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(true),
            );

            expect(result).toMatchSnapshot();
        });

        it('gets a dictionory of nested classnames for `"dashes"` setting', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.scss');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer('dashes'),
            );

            expect(result).toMatchSnapshot();
        });
    });

    describe('SASS', () => {
        it('gets a dictionory of nested classnames', async () => {
            const filepath = path.join(__dirname, 'styles', 'nested.sass');
            const result = await filePathToClassnameDict(
                filepath,
                getTransformer(false),
            );

            expect(result).toMatchSnapshot();
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
