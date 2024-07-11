/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { RoslynLanguageServer } from './roslynLanguageServer';
import { RoslynLanguageServerEvents } from './languageServerEvents';
import { languageServerOptions } from '../shared/options';
import { ServerState } from './serverStateChange';
import { getCSharpDevKit } from '../utils/getCSharpDevKit';

export function registerLanguageStatusItems(
    context: vscode.ExtensionContext,
    languageServer: RoslynLanguageServer,
    languageServerEvents: RoslynLanguageServerEvents
) {
    // DevKit will provide an equivalent workspace status item.
    if (!getCSharpDevKit()) {
        WorkspaceStatus.createStatusItem(context, languageServerEvents);
    }
    ProjectContextStatus.createStatusItem(context, languageServer);
}

class WorkspaceStatus {
    static createStatusItem(context: vscode.ExtensionContext, languageServerEvents: RoslynLanguageServerEvents) {
        const item = vscode.languages.createLanguageStatusItem(
            'csharp.workspaceStatus',
            languageServerOptions.documentSelector
        );
        item.name = vscode.l10n.t('C# Workspace Status');
        item.command = {
            command: 'dotnet.openSolution',
            title: vscode.l10n.t('Open solution'),
        };
        context.subscriptions.push(item);

        languageServerEvents.onServerStateChange((e) => {
            item.text = e.workspaceLabel;
            item.busy = e.state === ServerState.ProjectInitializationStarted;
        });
    }
}

class ProjectContextStatus {
    static createStatusItem(context: vscode.ExtensionContext, languageServer: RoslynLanguageServer) {
        const projectContextService = languageServer._projectContextService;
        const selectContextCommand = {
            command: 'csharp.changeDocumentContext',
            title: vscode.l10n.t('Select context'),
        };
        const item = vscode.languages.createLanguageStatusItem(
            'csharp.projectContextStatus',
            languageServerOptions.documentSelector
        );
        item.name = vscode.l10n.t('C# Project Context Status');
        item.detail = vscode.l10n.t('Active File Context');
        context.subscriptions.push(item);

        projectContextService.onDocumentContextChanged((e) => {
            if (vscode.window.activeTextEditor?.document.uri === e.uri) {
                item.text = e.context._vs_label;
                item.command = e.hasAdditionalContexts ? selectContextCommand : undefined;
            }
        });
        projectContextService.refresh();
    }
}
