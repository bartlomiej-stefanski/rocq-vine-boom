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

	const soundPath = path.join(context.extensionPath, 'vine-boom.mp3');
	let lastErrorCount = 0;
	const errorListener = vscode.languages.onDidChangeDiagnostics(e => {
		//console.log('DIAGNOSTICS CHANGED');
		let errorCnt = 0;
		for (const uri of e.uris) {
			const diag = vscode.languages.getDiagnostics(uri);
			errorCnt += diag.filter(d => {
				const isTacticFailure = 
					/unify|inductive|environment/i.test(d.message);
				
				return isTacticFailure && d.severity == vscode.DiagnosticSeverity.Error;
			}).length;
		}
		if (errorCnt > lastErrorCount) {
			//console.log('Should play sound...');
			playSound(soundPath);
		}
		//console.log(errorCnt);
		lastErrorCount = errorCnt;
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('rocq-vine-boom.testSound', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		playSound(soundPath);
		vscode.window.showInformationMessage("BOOM");
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(errorListener);
}

// This method is called when your extension is deactivated
export function deactivate() {}
