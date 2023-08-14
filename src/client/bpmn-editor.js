/* eslint-env browser */

/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-editor.css';

import BpmnModeler from 'bpmn-js/lib/Modeler';


/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

const modeler = new BpmnModeler({
  container: '#canvas'
});

modeler.on('import.done', () => {
  return vscode.postMessage({
    type: 'import',
    idx: -1
  });
});


modeler.on('commandStack.changed', () => {

  /**
   * @type { import('diagram-js/lib/command/CommandStack').default }
   */
  const commandStack = modeler.get('commandStack');

  return vscode.postMessage({
    type: 'change',
    idx: commandStack._stackIdx
  });
});

// handle messages from the extension
window.addEventListener('message', async (event) => {

  const {
    type,
    body,
    requestId
  } = event.data;

  console.log('message', type, body);

  switch (type) {
  case 'init':
    if (body.untitled) {
      return modeler.createDiagram();
    } else {
      return modeler.importXML(body.content);
    }

  case 'update': {
    if (body.content) {
      return modeler.importXML(body.content);
    }

    if (body.undo) {
      return modeler.get('commandStack').undo();
    }

    if (body.redo) {
      return modeler.get('commandStack').redo();
    }

    break;
  }

  case 'triggerAction':
    return modeler.get('editorActions').trigger(body.action, body.options);

  case 'getText':
    return modeler.saveXML({ format: true }).then(({ xml }) => {
      return vscode.postMessage({
        type: 'response',
        requestId,
        body: xml
      });
    });

  }
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });