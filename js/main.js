function webJSchemaToJava() {

}

function webJSchemaToJavascript() {
	var jschema = document.getElementById("jschemaInput").value;
	//var className = "MyClass"; // This should be updated before release
	var className=document.getElementById('className').value;
	className=className.charAt(0).toUpperCase()+className.slice(1);
	var output = generateJavascriptForJSchema(jschema, className);
	document.getElementById('jschemaOutput').innerHTML = output;
}

function webJSONToJSchema() {
	var json = document.getElementById("jsonInput").value;
	var output = jsonToJSchema(json);
	document.getElementById('jsonOutput').innerHTML = JSON.stringify(output);
}
