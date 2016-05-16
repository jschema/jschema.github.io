/*/*
 This javascript file provides functionality for generating java source code for working with
 JSON documents that satisfy a given jSchema
 */
var indent="  ";
var currIndent="        ";
function generateJavascriptForJSchema(jSchema, className) {
  var parseFunction = indent+"parse: function(jsonData){\n" +
                      indent+indent+"var json;\n" +
                      indent+indent+"if(typeof jsonData != 'undefined'){\n" +
                      indent+indent+indent+"try{\n" +
                      indent+indent+indent+indent+"json = JSON.parse(jsonData);\n" +
                      indent+indent+indent+"}catch(e){\n" +
                      indent+indent+indent+indent+"return \"Invalid JSON format\";\n" +
                      indent+indent+indent+"}\n" +
                      indent+indent+indent+"return Object.assign(json, this.create());\n" +
                      indent+indent+"}\n" +
                      indent+"}\n";

  try{
    var schema = JSON.parse(jSchema);
  } catch(e){
    return "Invalid jSchema format";
  }

  return  "var " + className + " = {\n" +
          generateCreate(schema) +
          parseFunction +
          "};\n";
}
  var generatedSetters = "";
  var generatedSchema = indent+indent+indent+"jschema: {";
function generateCreate(schema){


  for(var key in schema){
    if (schema.hasOwnProperty(key)){
        //check if array
         if(Object.prototype.toString.call(schema[key]).slice(8, -1) === 'Array'){
            /*edge case->empty arrays*/
            //check if enum or regular array
            if((schema[key][0]).charAt(0) !== '@' && Object.prototype.toString.call(schema[key][0]).slice(8, -1) === 'String'){
                generatedSetters += generateEnum(key, schema[key]);
                generatedSchema += "\n"+currIndent + key + ": [";
                for (var elem in schema[key]){
                   if(elem!=0){
                      generatedSchema += ", ";
                   }
                   generatedSchema += "\"" + schema[key][elem] + "\"";
                }
                generatedSchema += "],";
            }else{
                  generatedSetters += generateArray(key, schema[key]);
                  generatedSchema += "\n"+currIndent + key + ": [\"" + schema[key] + "\"],";
            }
         }else if (Object.prototype.toString.call(schema[key]).slice(8, -1) === 'Object'){
            generateObject(key,schema[key]);
         }
         else{
            generatedSetters += generateSetter(key, schema[key]);
            generatedSchema += "\n"+currIndent + key + ": \"" + schema[key] + "\",";
      }
    }
  }
    currIndent=currIndent.substring(0,currIndent.length-2);
  generatedSchema += "\n"+currIndent+"},\n";
  return  indent+"create: function(){\n" +
          indent+indent+"return{\n" +
          generatedSchema +
          indent+indent+indent+"validate: function(){\n" +
          indent+indent+indent+indent+"var validators = {};\n" +
          indent+indent+indent+indent+"var msg = \"\";\n" +
          generatedSetters +
          indent+indent+indent+indent+"for(var key in validators){\n" +
          indent+indent+indent+indent+indent+"if(this[key]){\n" +
          indent+indent+indent+indent+indent+indent+"msg += validators[key](this[key]);\n" +
          indent+indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"if(msg === \"\"){\n" +
          indent+indent+indent+indent+indent+"return \"Valid\";\n"+
          indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"return msg;\n"+
          indent+indent+indent+"},\n" +
          indent+indent+indent+"toJSON: function(){\n" +
          indent+indent+indent+indent+"var toJson = {};\n" +
          indent+indent+indent+indent+"for (var key in this){\n" +
          indent+indent+indent+indent+indent+"if (this.hasOwnProperty(key) && Object.prototype.toString.call(this[key]).slice(8, -1) !== 'Function') {\n" +
          indent+indent+indent+indent+indent+indent+"toJson[key] = this[key];\n" +
          indent+indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"return toJson;\n" +
          indent+indent+indent+"}\n" +
          indent+indent+"};\n" +
          indent+"},\n";
}

function generateValidator(type){
  switch(type){
    case "@string" :
      // https://toddmotto.com/understanding-javascript-types-and-reliable-type-checking/
      return "Object.prototype.toString.call(value).slice(8, -1) === 'String'";
    case "@boolean" :
      return "Object.prototype.toString.call(value).slice(8, -1) === 'Boolean'";
    case "@date" :
      return "!isNaN(Date.parse(value))";
    case "@uri" :
      // json_to_schema.js
      return " /^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})).?)(?::\\d{2,5})?(?:[/?#]\\S*)?$/i.test( value )"
    case "@int" :
      return "Number.isInteger(value)";
    case "@number" :
      return "!Number.isNaN(value)";
    default: // wildcard
        return "True";
  }
}
function generateArrayValidator(type){
  switch(type){
    case "@string" :
      // https://toddmotto.com/understanding-javascript-types-and-reliable-type-checking/
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'String'";
    case "@boolean" :
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'Boolean'";
    case "@date" :
      return "isNaN(Date.parse(value[elem]))";
    case "@uri" :
      // json_to_schema.js
      return "!( /^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})).?)(?::\\d{2,5})?(?:[/?#]\\S*)?$/i.test( value[elem] ))"
    case "@int" :
      return "!Number.isInteger(value[elem])";
    case "@number" :
      return "Number.isNaN(value[elem])";
    default: // wildcard
        //check if enumeration
        if(Object.prototype.toString.call(type).slice(8, -1) === 'String'){
            return "enum";
        }
        return "True";
  }
}

function generateSetter(key, type) {
  return  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
          currIndent+indent+"if(" + generateValidator(type) + "){\n" +
          currIndent+indent+indent+"this." + key + " = value;\n" +
          currIndent+indent+indent+"return \"\";\n" +
          currIndent+indent+"}\n" +
          currIndent+indent+"return \"" + key + "=\" + value + \" does not conform to " + type + "\\n\";\n" +
          currIndent+"};\n";
}

function generateArray(key,type){
    if(type.length<1) return "ERROR: Invalid JSchema Format";
    return  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
            currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
            currIndent+indent+indent+"for (var elem in value){\n" +
            currIndent+indent+indent+indent+"if(" + generateArrayValidator(type[0]) + "){\n" +
            currIndent+indent+indent+indent+indent+"return \"" + key + " =[\" + value + \"] does not conform to " + type + "\\n\";\n" +
            currIndent+indent+indent+indent+"}\n" +
            currIndent+indent+indent+"}\n" +
            currIndent+indent+indent+"this." + key + " = value;\n" +
            currIndent+indent+indent+"return \"\";\n" +
            currIndent+indent+"}else{\n"+
            currIndent+indent+indent+"return \"name =\" + value + \" does not conform to ["+ type+"]\\n\";\n"+
            currIndent+indent+"}"+
            currIndent+"};\n";
}
function generateEnum(key,type){
    if(type.length<1) return "ERROR: Invalid JSchema Format";
    var genEnum = currIndent+"validators[\"" + key + "\"] = function(value){\n" +
                 currIndent+indent+"switch(value){\n";
    for (var el in type){
        genEnum+=currIndent+indent+indent+"case \""+type[el]+"\" : ";
        genEnum+="break;\n"
    }
        genEnum+=currIndent+indent+indent+"default: return \"" + key + " =\" + value + \" does not conform to [" + type + "]\\n\";\n";
        genEnum+=currIndent+indent+"\n";
        genEnum+=currIndent+indent+"this." + key + " = value;\n";
        genEnum+=currIndent+indent+"return \"\";\n";
        genEnum+=currIndent+"};\n";

    return genEnum;
}

function generateObject(name,type){
  generatedSchema +="\n"+ currIndent + name + ": {";
  currIndent+="  ";
  generatedSetters +=currIndent+"validators[\"" + name + "\"] = function(value){\n";
  generatedSetters +=currIndent+indent+"var validators={};\n";
  generatedSetters +=currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === 'Object'){\n"+
                     currIndent+indent+indent+"this."+name+" = value;\n"+
                     currIndent+indent+"}else{\n"+
                     currIndent+indent+indent+"return \"" + name + " =\" + value + \" does not conform to " + type + "\\n\";\n"+
                     currIndent+indent+"}\n";
  for(var key in type){
    if (type.hasOwnProperty(key)){
       if(Object.prototype.toString.call(type[key]).slice(8, -1) === 'Array'){
                /*edge case->empty arrays*/
                 //check if enum or regular array
          if((type[key][0]).charAt(0) !== '@' && Object.prototype.toString.call(type[key][0]).slice(8, -1) === 'String'){
             generatedSetters += generateEnum(key, type[key]);
             generatedSchema += "\n"+currIndent + key + ": [";
             for (var elem in type[key]){
                if(elem!=0){
                   generatedSchema += ", ";
                }
                generatedSchema += "\"" + type[key][elem] + "\"";
             }
             generatedSchema += "],";

          }else{
             generatedSetters += generateArray(key, type[key]);
             generatedSchema += "\n" + currIndent + key + ": [\"" + type[key] + "\"],";
          }
       }else if (Object.prototype.toString.call(type[key]).slice(8, -1) === 'Object'){
                generateObject(key,type[key]);
       }else{
               currIndent+="  ";
               generatedSetters += generateSetter(key, type[key]);
               currIndent=currIndent.substring(0,currIndent.length-2);
                generatedSchema += "\n" + currIndent + key + ": \"" + type[key] + "\",";
       }
    }
  }
generatedSchema+="\n"+currIndent+"},";

   generatedSetters+=currIndent+indent+"for(var key in validators){\n" +
            currIndent+indent+indent+"if(value[key]){\n" +
            currIndent+indent+indent+indent+"msg += validators[key](value[key]);\n" +
            currIndent+indent+indent+"}\n" +
            currIndent+indent+"}\n" +
            currIndent+indent+"if(msg === \"\"){\n" +
            currIndent+indent+indent+"return \"Valid\";\n"+
            currIndent+indent+"}\n" +
            currIndent+indent+"return msg;\n"+
            currIndent+"};\n" ;
  currIndent=currIndent.substring(0,currIndent.length-2);

}