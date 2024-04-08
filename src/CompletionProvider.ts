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

export const COMPLETION_TRIGGERS = ['.', '[', '"', "'"] as const;

type FieldOptions = {
    wrappingBracket: boolean;
    startsWithQuote: boolean;
    endsWithQuote: boolean;
};

/**
 * check if current character or last character is any of the completion triggers (i.e. `.`, `[`) and return it
 *
 * @see COMPLETION_TRIGGERS
 */
function findTrigger(line: string, position: Position): string | undefined {
    const i = position.character - 1;

    for (const trigger of COMPLETION_TRIGGERS) {
        if (line[i] === trigger) {
            return trigger;
        }
        if (i > 1 && line[i - 1] === trigger) {
            return trigger;
        }
    }

    return undefined;
}

/**
 * Given the line, position and trigger, returns the identifier referencing the styles spreadsheet and the (partial) field selected with options to help construct the completion item later.
 *
 * @returns
 */
function getWords(
    line: string,
    position: Position,
    trigger: string,
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

    switch (trigger) {
        // process `.` trigger
        case '.':
            return words.split('.') as [string, string];
        // process `[` trigger
        default: {
            const [obj, field] = words.split('[');

            let lineAhead = line.slice(position.character);
            const endsWithQuote = lineAhead.search(/^["']/) !== -1;

            lineAhead = endsWithQuote ? lineAhead.slice(1) : lineAhead;
            const wrappingBracket = lineAhead.search(/^\s*\]/) !== -1;

            const startsWithQuote =
                field.length > 0 && (field[0] === '"' || field[0] === "'");

            return [
                obj,
                field.slice(startsWithQuote ? 1 : 0),
                {wrappingBracket, startsWithQuote, endsWithQuote},
            ];
        }
    }
}

function createCompletionItem(
    trigger: string,
    name: string,
    position: Position,
    fieldOptions: FieldOptions | undefined,
): CompletionItem {
    const nameIncludesDashes = name.includes('-');
    const completionField =
        trigger === '[' || nameIncludesDashes ? `['${name}']` : name;

    let completionItem: CompletionItem;
    // in case of items with dashes, we need to replace the `.` and suggest the field using the subscript expression `[`
    if (trigger === '.') {
        if (nameIncludesDashes) {
            const range = lsp.Range.create(
                lsp.Position.create(position.line, position.character - 1), // replace the `.` character
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
        const startPositionCharacter =
            position.character -
            1 - // replace the `[` character
            (fieldOptions?.startsWithQuote ? 1 : 0); // replace the starting quote if present

        const endPositionCharacter =
            position.character +
            (fieldOptions?.endsWithQuote ? 1 : 0) + // replace the ending quote if present
            (fieldOptions?.wrappingBracket ? 1 : 0); // replace the wrapping bracket if present

        const range = lsp.Range.create(
            lsp.Position.create(position.line, startPositionCharacter),
            lsp.Position.create(position.line, endPositionCharacter),
        );

        completionItem = CompletionItem.create(completionField);
        completionItem.textEdit = lsp.InsertReplaceEdit.create(
            completionField,
            range,
            range,
        );
    }

    return completionItem;
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

        const trigger = findTrigger(currentLine, position);
        if (!trigger) {
            return [];
        }

        const foundFields = getWords(currentLine, position, trigger);
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

            const completionItem = createCompletionItem(
                trigger,
                name,
                position,
                fieldOptions,
            );

            return completionItem;
        });

        return res.map((x, i) => ({
            ...x,
            kind: lsp.CompletionItemKind.Text,
            data: i + 1,
        }));
    }
}
