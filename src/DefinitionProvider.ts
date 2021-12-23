import path from 'path';
import {EOL} from 'os';
import {Hover, Location, Position, Range} from 'vscode-languageserver-protocol';
import {TextDocument} from 'vscode-languageserver-textdocument';
import * as lsp from 'vscode-languageserver/node';
import {
    CamelCaseValues,
    Classname,
    filePathToClassnameDict,
    findImportPath,
    genImportRegExp,
    getCurrentDirFromUri,
    getPosition,
    getTransformer,
    getWords,
    isImportLineMatch,
    stringiyClassname,
} from './utils';
import {textDocuments} from './textDocuments';

export class CSSModulesDefinitionProvider {
    _camelCaseConfig: CamelCaseValues;

    constructor(camelCaseConfig: CamelCaseValues) {
        this._camelCaseConfig = camelCaseConfig;
    }

    updateSettings(camelCaseConfig: CamelCaseValues): void {
        this._camelCaseConfig = camelCaseConfig;
    }

    definition = async (params: lsp.DefinitionParams) => {
        const textdocument = textDocuments.get(params.textDocument.uri);
        if (textdocument === undefined) {
            return [];
        }

        return this.provideDefinition(textdocument, params.position);
    };

    hover = async (params: lsp.HoverParams) => {
        const textdocument = textDocuments.get(params.textDocument.uri);
        if (textdocument === undefined) {
            return null;
        }

        return this.provideHover(textdocument, params.position);
    };

    async provideHover(
        textdocument: TextDocument,
        position: Position,
    ): Promise<null | Hover> {
        const fileContent = textdocument.getText();
        const lines = fileContent.split(EOL);
        const currentLine = lines[position.line];

        if (typeof currentLine !== 'string') {
            return null;
        }
        const currentDir = getCurrentDirFromUri(textdocument.uri);

        const words = getWords(currentLine, position);
        if (words === '' || words.indexOf('.') === -1) {
            return null;
        }

        const [obj, field] = words.split('.');
        const importPath = findImportPath(fileContent, obj, currentDir);
        if (importPath === '') {
            return null;
        }

        const dict = await filePathToClassnameDict(
            importPath,
            getTransformer(this._camelCaseConfig),
        );

        const node: void | Classname = dict[`.${field}`];

        if (!node) return null;

        return {
            contents: {
                language: 'css',
                value: stringiyClassname(field, node.declarations),
            },
        };
    }

    async provideDefinition(
        textdocument: TextDocument,
        position: Position,
    ): Promise<Location | null> {
        const fileContent = textdocument.getText();
        const lines = fileContent.split(EOL);
        const currentLine = lines[position.line];

        if (typeof currentLine !== 'string') {
            return null;
        }
        const currentDir = getCurrentDirFromUri(textdocument.uri);

        const matches = genImportRegExp('(\\S+)').exec(currentLine);
        if (
            matches &&
            isImportLineMatch(currentLine, matches, position.character)
        ) {
            const filePath: string = path.resolve(currentDir, matches[2]);
            const targetRange: Range = Range.create(
                Position.create(0, 0),
                Position.create(0, 0),
            );
            return Location.create(filePath, targetRange);
        }

        const words = getWords(currentLine, position);
        if (words === '' || words.indexOf('.') === -1) {
            return null;
        }

        const [obj, field] = words.split('.');
        const importPath = findImportPath(fileContent, obj, currentDir);
        if (importPath === '') {
            return null;
        }

        const targetPosition = await getPosition(
            importPath,
            field,
            this._camelCaseConfig,
        );

        if (targetPosition === null) {
            return null;
        } else {
            const targetRange: Range = {
                start: targetPosition,
                end: targetPosition,
            };
            return Location.create(`file://${importPath}`, targetRange);
        }
    }
}
