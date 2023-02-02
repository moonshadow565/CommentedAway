'use strict';

import * as vscode from 'vscode';

class LineBuilder {
	indent: number = -1;
	start: number = 0;
	end: number = 0;
	ranges: vscode.FoldingRange[] = new Array();

	push(line: vscode.TextLine) {
		let text = line.text;
		let indent = line.firstNonWhitespaceCharacterIndex;
		let cur = line.range.start.line;
		if (!text.startsWith('//', indent)) {
			this.finalize();
			return;
		}
		if (this.end != cur || this.indent != indent) {
			this.finalize();
			this.start = cur;
		}
		this.indent = indent;
		this.end = cur + 1;
	}

	finalize() {
		if (this.end - this.start > 1) {
			this.ranges.push(new vscode.FoldingRange(this.start, this.end - 1));
			this.start = 0;
			this.end = 0;
			this.indent = -1;
		}
	}
}

export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	public constructor() {}

	onDidChangeFoldingRanges?: vscode.Event<void> | undefined;

	provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
		let builder = new LineBuilder();
		for (let i = 0; i < document.lineCount; ++i) {
			builder.push(document.lineAt(i));
		}
		builder.finalize();
		return builder.ranges;
	}
}

export function activate(context: vscode.ExtensionContext) {
	let sel: vscode.DocumentSelector = { scheme: 'file', language: 'cpp' };
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(
		sel,
		new FoldingRangeProvider()
	))
}