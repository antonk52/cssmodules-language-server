import {EOL} from 'os';
import {CompletionItem, type Position} from 'vscode-languageserver-protocol';
import type {TextDocument} from 'vscode-languageserver-textdocument';
import * as lsp from 'vscode-languageserver/node';
import {textDocuments} from './textDocuments';
import {
    findImportPath,
    getAllClassNames,
    getCurrentDirFromUri,
    getTransformer,
} from './utils';
import type {CamelCaseValues} from './utils';

// check if current character or last character is .
function isTrigger(line: string, position: Position): boolean {
    const i = position.character - 1;
    return line[i] === '.' || (i > 1 && line[i - 1] === '.');
}

function getWords(line: string, position: Position): string {
    const text = line.slice(0, position.character);
    const index = text.search(/[a-z0-9\._]*$/i);
    if (index === -1) {
        return '';
    }

    return text.slice(index);
}

export class CSSModulesCompletionProvider {
    _classTransformer: (x: string) => string;

    constructor(camelCaseConfig: CamelCaseValues) {
        this._classTransformer = getTransformer(camelCaseConfig);
    }

    updateSettings(camelCaseConfig: CamelCaseValues): void {
        this._classTransformer = getTransformer(camelCaseConfig);
    }

    completion = async (params: lsp.CompletionParams) => {
        const textdocument = textDocuments.get(params.textDocument.uri);
        if (textdocument === undefined) {
            return [];
        }

        return this.provideCompletionItems(textdocument, params.position);
    };

    async provideCompletionItems(
        textdocument: TextDocument,
        position: Position,
    ): Promise<CompletionItem[] | null> {
        const fileContent = textdocument.getText();
        const lines = fileContent.split(EOL);
        const currentLine = lines[position.line];
        if (typeof currentLine !== 'string') return null;
        const currentDir = getCurrentDirFromUri(textdocument.uri);

        if (!isTrigger(currentLine, position)) {
            return [];
        }

        const words = getWords(currentLine, position);

        if (words === '' || words.indexOf('.') === -1) {
            return [];
        }

        const [obj, field] = words.split('.');

        const importPath = findImportPath(fileContent, obj, currentDir);
        if (importPath === '') {
            return [];
        }

        const classNames: string[] = await getAllClassNames(
            importPath,
            field,
            this._classTransformer,
        ).catch(() => []);

        const res = classNames.map(_class => {
            // const name = this._classTransformer(_class);
            const name = _class;

            const completionItem = CompletionItem.create(name);

            // in case of items with dashes, we need to replace the `.` and add our field
            if (name.includes('-')) {
                completionItem.textEdit = lsp.InsertReplaceEdit.create(
                    name,
                    lsp.Range.create(
                        lsp.Position.create(
                            position.line,
                            position.character - 1,
                        ),
                        position,
                    ),
                    lsp.Range.create(
                        lsp.Position.create(
                            position.line,
                            position.character - 1,
                        ),
                        position,
                    ),
                );
            }
            return completionItem;
        });

        return res.map((x, i) => ({
            ...x,
            kind: lsp.CompletionItemKind.Text,
            data: i + 1,
        }));
    }
}
