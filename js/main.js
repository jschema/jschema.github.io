function webJSchemaToJava() {
    var jschema = document.getElementById("jschemaInput").value;
	var className=document.getElementById('className').value;
	if(className ===""){
	    alert("Please Enter a Class Name");
	}
	className=className.charAt(0).toUpperCase()+className.slice(1);
	var output = generateAll(className, jschema);
	document.getElementById('jschemaOutput').innerHTML = output;
}

function webJSchemaToJavascript() {
	var jschema = document.getElementById("jschemaInput").value;
	var className=document.getElementById('className').value;
	className=className.charAt(0).toUpperCase()+className.slice(1);
	var output = generateJavascriptForJSchema(jschema, className);
	document.getElementById('jschemaOutput').innerHTML = output;
}

function generateCode(){
    var codeType=document.getElementById('selectCode').value;
    if(codeType === "Java 8"){
        webJSchemaToJava();
    }else{
        webJSchemaToJavascript();
    }
}

function webJSONToJSchema() {
	var json = document.getElementById("jsonInput").value;
	var output = jsonToJSchema(json);
	document.getElementById('jsonOutput').innerHTML = JSON.stringify(output);
}
