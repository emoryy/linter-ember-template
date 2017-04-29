var Linter = require('ember-template-lint');
var loophole = require('loophole');
var LinterHelpers = require('atom-linter');
var { File, Directory } = require('atom');

'use babel'

const configFileName = ".template-lintrc.js";

function getConfigFileFromDirectory(directory) {
  return directory.getEntriesSync().find(function(entry) {
    return entry.isFile() && entry.getBaseName() === configFileName;
  });
}

function findConfigFileForFilePath(editorFilePath) {
  let currentDir = new File(editorFilePath).getParent();
  let foundConfig;
  while (!(foundConfig = getConfigFileFromDirectory(currentDir)) && !currentDir.isRoot()) {
    currentDir = currentDir.getParent();
  }
  return foundConfig && foundConfig.getPath();
}

module.exports = {
  provideLinter() {
    const provider = {
      name: 'Ember Template Linter',
      grammarScopes: [
        'text.html.mustache',
        'text.html.htmlbars',
        'text.html.handlebars'
      ],
      scope: 'file', // or 'project'
      lintOnFly: true,
      lint: function(textEditor) {
        return new Promise(function(resolve, reject) {
          let options = {
            configPath: findConfigFileForFilePath(textEditor.getPath())
          };
          let linter = new Linter(options);

          let linterErrors = [];

          loophole.allowUnsafeNewFunction(() => {
            linterErrors = linter.verify({
              source: textEditor.getText(),
              moduleId: textEditor.getPath().slice(0, -4)
            });
          });

          let errors = [];

          linterErrors.forEach((error) => {
            errors.push({
              type: 'Error',
              text: error.message,
              range: LinterHelpers.rangeFromLineNumber(textEditor, error.line - 1),
              filePath: textEditor.getPath()
            });
          });

          resolve(errors);
        })
      }
    }
    return provider
  }
}
