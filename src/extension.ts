import * as vscode from 'vscode';
import * as path from 'path';
const player = require('play-sound')({ players: ['ffplay'] });

function playSound(soundPath: string) {
	player.play(soundPath, {
		ffplay: ['-nodisp', '-autoexit']
	}, (err: any) => {
		if (err) console.log("boom failed...", err);
	});
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "rocq-vine-boom" is now active!');

	const tacticErrorSound = path.join(context.extensionPath, 'vine-boom.mp3');
	const qedFailSound = path.join(context.extensionPath, 'falling-metal-pipe.mp3');

	let wasTyping = false;
	let lastTypedChar = -1;
	let lastTypedLine = -1;
	const typingListener = vscode.workspace.onDidChangeTextDocument(e => {
		lastTypedChar = vscode.window.activeTextEditor?.selection.active.character ?? -1;
		lastTypedLine = vscode.window.activeTextEditor?.selection.active.line ?? -1;
		wasTyping = true;
	});

	let lastErrorCount = 0;
	const errorListener = vscode.languages.onDidChangeDiagnostics(e => {
		const editor = vscode.window.activeTextEditor;
		let errorCnt = 0;
		let cursorOnError = false;
		let qedFail = false;

		for (const uri of e.uris) {
			const uriString = uri.toString();
			let cursorPosition = null;
			if (editor && editor.document.uri.toString() === uriString) {
				cursorPosition = editor.selection.active;

				if (wasTyping) {
					const onSameLine = lastTypedLine === cursorPosition.line;
					const justDeletedChar = lastTypedChar - 1 === cursorPosition.character;

					// Works *almost* always.
					// Edge case if user deletes many chars at once (or we get bad timing, etc...).
					const mightBeErrorDueToTyping = onSameLine && justDeletedChar;
					if (!mightBeErrorDueToTyping) {
						wasTyping = false;
					}
				}
			}

			const diag = vscode.languages.getDiagnostics(uri);
			errorCnt += diag.filter(d => {
				const isTacticFailure = 
					/unify|not (an )?inductive|environment|no product|tactic failure|no such hypothesis|not a declared reflexive|primitive equality/i.test(d.message);

				const isQedFailure = /incomplete proof/i.test(d.message);
				if (isQedFailure) {
					qedFail = true;
				}
				
				const isFailure = isTacticFailure || isQedFailure;

				const cursorLine = cursorPosition?.line ?? -1;
				const cursorPos = cursorPosition?.character ?? -1;
				const cursorOnErrorLine = cursorLine === d.range.end.line;
				const cursorAfterError = d.range.end.character === cursorPos;
				if (isFailure && cursorOnErrorLine && cursorAfterError) {
					cursorOnError = true;
				}

				return isFailure && d.severity === vscode.DiagnosticSeverity.Error;
			}).length;
		}

		if (errorCnt > lastErrorCount || (cursorOnError && !wasTyping)) {
			if (qedFail) {
				playSound(qedFailSound);
			} else {
				playSound(tacticErrorSound);
			}
		}

		lastErrorCount = errorCnt;
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('rocq-vine-boom.testSound', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		playSound(tacticErrorSound);
		vscode.window.showInformationMessage("BOOM");
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(typingListener);
	context.subscriptions.push(errorListener);
}

// This method is called when your extension is deactivated
export function deactivate() {}
