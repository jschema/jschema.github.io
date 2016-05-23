/*
  This javascript file provides functionality for generating java source code for working with
  JSON documents that satisfy a given jSchema
*/

function generateJavaForJSchema(jSchema, className) {
  var generatedSource = "package " + packageFor(className)
  return generatedSource
}

function packageFor(className) {
  return "foo"
}
