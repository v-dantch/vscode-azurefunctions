/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, ProcessExecution, Task, TaskDefinition, TaskProvider, workspace } from 'vscode';
import { ProjectLanguage } from './constants';
import { ext } from './extensionVariables';
import { getFuncExtensionSetting, getProjectLanguage } from './ProjectSettings';

export class FuncTaskProvider implements TaskProvider {
    public async provideTasks(_token?: CancellationToken | undefined): Promise<Task[]> {
        const result: Task[] = [];
        if (workspace.workspaceFolders) {
            for (const folder of workspace.workspaceFolders) {
                const taskDefinition: TaskDefinition = { type: 'func', command: 'host start', port: 5858 };
                const projectLanguage: ProjectLanguage = await getProjectLanguage(folder.uri.fsPath, ext.ui);
                if (projectLanguage !== undefined) {
                    let execution: ProcessExecution;
                    //let dependsOn: string | undefined;
                    switch (projectLanguage) {
                        case ProjectLanguage.JavaScript:
                            execution = new ProcessExecution('func', ['host', 'start'], { env: { 'languageWorkers:node:arguments': `--inspect=${getFuncExtensionSetting('nodeDebugPort', folder.uri.fsPath)}` } });
                            //dependsOn = 'installExtensions';
                            break;
                        case ProjectLanguage.Java:
                            execution = new ProcessExecution('func', ['host', 'start'], { env: { 'languageWorkers:node:arguments': `--inspect=${getFuncExtensionSetting('nodeDebugPort', folder.uri.fsPath)}` } });
                            break;
                        case ProjectLanguage.CSharp:
                            execution = new ProcessExecution('func', ['host', 'start'], { env: { 'languageWorkers:node:arguments': `--inspect=${getFuncExtensionSetting('nodeDebugPort', folder.uri.fsPath)}` } });
                            break;
                        default:
                            continue;
                    }

                    const task: Task = new Task(
                        taskDefinition,
                        folder,
                        'host start',
                        'func',
                        execution,
                        '$func-watch'
                    );
                    task.isBackground = true;
                    // todo task.dependsOn = dependsOn;
                    result.push(task);
                }
            }
        }

        return result;
    }

    public async resolveTask(_task: Task, _token?: CancellationToken | undefined): Promise<Task | undefined> {
        // The resolveTask method returns undefined and is currently not called by VS Code. It is there to optimize task loading in the future.
        // https://code.visualstudio.com/docs/extensions/example-tasks
        return undefined;
    }
}
