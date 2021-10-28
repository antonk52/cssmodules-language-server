import * as lsp from 'vscode-languageserver/node';

import {CSSModulesCompletionProvider} from './CompletionProvider';
import {CSSModulesDefinitionProvider} from './DefinitionProvider';
import {textDocuments} from './textDocuments';

export function createConnection(): lsp.Connection {
    const connection = lsp.createConnection(process.stdin, process.stdout);

    textDocuments.listen(connection);

    const defaultSettings = {
        camelCase: true,
    } as const;

    const completionProvider = new CSSModulesCompletionProvider(
        defaultSettings.camelCase,
    );
    const definitionProvider = new CSSModulesDefinitionProvider(
        defaultSettings.camelCase,
    );

    connection.onInitialize(({capabilities, initializationOptions}) => {
        if (initializationOptions) {
            if ('camelCase' in initializationOptions) {
                completionProvider.updateSettings(
                    initializationOptions.camelCase,
                );
                definitionProvider.updateSettings(
                    initializationOptions.camelCase,
                );
            }
        }
        const hasWorkspaceFolderCapability = !!(
            capabilities.workspace && !!capabilities.workspace.workspaceFolders
        );
        const result: lsp.InitializeResult = {
            capabilities: {
                textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
                definitionProvider: true,
                completionProvider: {
                    /**
                     * only invoke completion once `.` is pressed
                     */
                    triggerCharacters: ['.'],
                    resolveProvider: true,
                },
            },
        };
        if (hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true,
                },
            };
        }

        return result;
    });

    connection.onCompletion(completionProvider.completion);
    connection.onDefinition(definitionProvider.definition);

    return connection;
}
