/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Extension, extensions, ProcessExecution, ShellExecution, ShellExecutionOptions, Task, TaskProvider, workspace, WorkspaceFolder } from 'vscode';
import { convertToVenvCommand } from './commands/createNewProject/PythonProjectCreator';
import { isFunctionProject } from './commands/createNewProject/validateFunctionProjects';
import { extInstallCommand, func, funcWatchProblemMatcher, hostStartCommand, ProjectLanguage, projectLanguageSetting } from './constants';
import { getFuncExtensionSetting } from './ProjectSettings';

export class FuncTaskProvider implements TaskProvider {
    public async provideTasks(_token?: CancellationToken | undefined): Promise<Task[]> {
        const result: Task[] = [];
        if (workspace.workspaceFolders) {
            for (const folder of workspace.workspaceFolders) {
                if (await isFunctionProject(folder.uri.fsPath)) {
                    result.push(getExtensionInstallTask(folder));
                    const hostStartTask: Task | undefined = await getHostStartTask(folder);
                    if (hostStartTask) {
                        result.push(hostStartTask);
                    }
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

async function getHostStartTask(folder: WorkspaceFolder): Promise<Task | undefined> {
    const host: string = '127.0.0.1';
    let port: number | undefined;

    let options: ShellExecutionOptions | undefined;
    let command: string = 'func host start';

    const language: string | undefined = getFuncExtensionSetting(projectLanguageSetting, folder.uri.fsPath);
    switch (language) {
        case ProjectLanguage.Python:
            port = port || 9091;
            const venvName: string | undefined = getFuncExtensionSetting<string>('pythonVenv', folder.uri.fsPath);
            if (venvName) {
                command = convertToVenvCommand(venvName, process.platform, command);
            }
            options = { env: { languageWorkers__python__arguments: await getPythonCommand(host, port) } };
            break;
        case ProjectLanguage.JavaScript:
            port = port || 5858;
            options = { env: { languageWorkers__node__arguments: `--inspect=${port}` } };
            break;
        case ProjectLanguage.Java:
            port = port || 5005;
            options = { env: { languageWorkers__java__arguments: `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=${port}` } };
            break;
        default:
    }

    return new Task(
        {
            type: func,
            command: hostStartCommand
        },
        folder,
        hostStartCommand,
        func,
        new ShellExecution(command, options),
        funcWatchProblemMatcher
    );
}

function getExtensionInstallTask(folder: WorkspaceFolder): Task {
    return new Task(
        {
            type: func,
            command: extInstallCommand
        },
        folder,
        extInstallCommand,
        func,
        new ProcessExecution(func, ['extensions', 'install'])
    );
}

async function getPythonCommand(host: string, port: number): Promise<string> {
    const pyExtension: Extension<IPythonExtensionApi> | undefined = extensions.getExtension<IPythonExtensionApi>('ms-python.python');
    if (pyExtension) {
        if (!pyExtension.isActive) {
            await pyExtension.activate();
        }

        // tslint:disable-next-line:strict-boolean-expressions
        if (pyExtension.exports && pyExtension.exports.debug) {
            return (await pyExtension.exports.debug.getRemoteLauncherCommand(host, port)).join(' ');
        }
    }

    throw new Error('todo');
}
