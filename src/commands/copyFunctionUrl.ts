/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as clipboardy from 'clipboardy';
import { ext } from '../extensionVariables';
import { localize } from '../localize';
import { FunctionTreeItem } from '../tree/FunctionTreeItem';

export async function copyFunctionUrl(node?: FunctionTreeItem): Promise<void> {
    if (!node) {
        node = <FunctionTreeItem>await ext.tree.showTreeItemPicker(FunctionTreeItem.contextValue);
    }

    if (node.config.isHttpTrigger) {
        await clipboardy.write(node.triggerUrl);
    } else {
        throw new Error(localize('CopyFailedForNonHttp', 'Function URLs can only be used for HTTP triggers.'));
    }
}
