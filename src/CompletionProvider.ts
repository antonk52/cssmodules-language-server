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

export const COMPLETION_TRIGGERS = ['.', '['] as const;

/**
 * check if current character or last character is any of the completion triggers (i.e. `.`, `[`)
 *
 * @see COMPLETION_TRIGGERS
 */
function findTrigger(
    line: string,
    position: Position,
): [string, number] | undefined {
    const i = position.character - 1;

    for (const trigger of COMPLETION_TRIGGERS) {
        if (line[i] === trigger) {
            return [trigger, i];
        }
        if (i > 1 && line[i - 1] === trigger) {
            return [trigger, i - 1];
        }
    }
    return undefined;
}

function getWords(
    line: string,
    position: Position,
    [trigger]: [string, number],
): [string, string, FieldOptions?] | undefined {
    const text = line.slice(0, position.character);
    const index = text.search(/[a-z0-9\._\[\]'"\-]*$/i);
    if (index === -1) {
        return undefined;
    }

    const words = text.slice(index);

    if (words === '' || words.indexOf(trigger) === -1) {
        return undefined;
    }

    // process `.` trigger
    if (trigger === '.') {
        return words.split('.') as [string, string];
    }

    // process `[` trigger
    const [obj, field] = words.split('[');

    return [obj, ...trimQuotes(field)];
}

type FieldOptions = {
    wrappingBracket: boolean;
    startsWithQuote: string | false;
    endsWithQuote: string | false;
};

function trimQuotes(field: string): [string, FieldOptions] {
    let _field = field;

    const wrappingBracket = _field[_field.length - 1] === ']';
    if (wrappingBracket) {
        _field = _field.slice(0, _field.length - 1);
    }

    const startsWithQuote =
        _field.length > 0 && (_field[0] === '"' || _field[0] === "'")
            ? _field[0]
            : false;

    const endsWithQuote =
        _field.length > 1 && // must be > 1 to avoid checking same char as the `startsWithQuote`
        (_field[_field.length - 1] === '"' || _field[_field.length - 1] === "'")
            ? _field[_field.length - 1]
            : false;

    return [
        _field.slice(
            startsWithQuote ? 1 : 0,
            endsWithQuote ? _field.length - 1 : _field.length,
        ),
        {wrappingBracket, startsWithQuote, endsWithQuote},
    ];
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

        const foundTrigger = findTrigger(currentLine, position);
        if (!foundTrigger) {
            return [];
        }

        const foundFields = getWords(currentLine, position, foundTrigger);
        if (!foundFields) {
            return [];
        }

        const [obj, field, fieldOptions] = foundFields;

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
            const name = this._classTransformer(_class);

            const [trigger] = foundTrigger;

            const nameIncludesDashes = name.includes('-');
            const completionField =
                trigger === '[' || nameIncludesDashes ? `['${name}']` : name;

            // FIXME - avoid extra ] at the end - moliva - 2024/04/08
            // FIXME - when adding quotes ' or " it won't suggest anything - moliva - 2024/04/08

            let completionItem: CompletionItem;
            // in case of items with dashes, we need to replace the `.` and suggest the field using the subscript expression `[`
            if (trigger === '.') {
                if (nameIncludesDashes) {
                    const range = lsp.Range.create(
                        lsp.Position.create(
                            position.line,
                            position.character - 1,
                        ),
                        position,
                    );

                    completionItem = CompletionItem.create(completionField);
                    completionItem.textEdit = lsp.InsertReplaceEdit.create(
                        completionField,
                        range,
                        range,
                    );
                } else {
                    completionItem = CompletionItem.create(completionField);
                }
            } else {
                // trigger === '['
                const range = lsp.Range.create(
                    lsp.Position.create(
                        position.line,
                        position.character -
                            1 -
                            (fieldOptions?.startsWithQuote ? 1 : 0),
                    ),
                    lsp.Position.create(
                        position.line,
                        position.character +
                            1 +
                            +(fieldOptions?.endsWithQuote ? 1 : 0) +
                            (fieldOptions?.wrappingBracket ? 1 : 0),
                    ),
                );

                completionItem = CompletionItem.create(completionField);
                completionItem.textEdit = lsp.InsertReplaceEdit.create(
                    completionField,
                    range,
                    range,
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
