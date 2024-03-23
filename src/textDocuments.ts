import {TextDocument} from 'vscode-languageserver-textdocument';
import {TextDocuments} from 'vscode-languageserver/node';

export const textDocuments: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument,
);
