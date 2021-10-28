import {TextDocuments} from 'vscode-languageserver/node';
import {TextDocument} from 'vscode-languageserver-textdocument';

export const textDocuments: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument,
);
