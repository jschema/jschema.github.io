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
                      indent+indent+indent+"var obj=this.create();\n"+
                      indent+indent+indent+"for (var key in obj){\n"+
                      indent+indent+indent+indent+"if(obj.hasOwnProperty(key)) json[key]=obj[key];\n"+
                      indent+indent+indent+"}\n"+
                      indent+indent+indent+"return json;\n" +
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
    var first=1;
    var isArray=0;
    if(Object.prototype.toString.call(schema).slice(8, -1) === 'Array'){
        isArray=1;
      //  generatedSchema += "\n"+currIndent + "[";
        schema=schema[0];
        /*if(Object.prototype.toString.call(schema).slice(8, -1)==='Object'){
            generatedSchema += "{";
            isArray=2;
        }*/
    }
  for(var key in schema){
    if (schema.hasOwnProperty(key)){
        //check if array
         if(Object.prototype.toString.call(schema[key]).slice(8, -1) === 'Array'){
            /*edge case->empty arrays*/
            //check if enum or regular array
            if(String(schema[key][0]).charAt(0) !== '@' && schema[key][0] !=='*' && Object.prototype.toString.call(schema[key][0]).slice(8, -1) === 'String'){
                generatedSetters += generateEnum(key, schema[key]);

                if(!first)generatedSchema += ",";
                generatedSchema += "\n"+currIndent + key + ": [";
                for (var elem in schema[key]){
                   if(elem!=0){
                      generatedSchema += ", ";
                   }
                   generatedSchema += "\"" + schema[key][elem] + "\"";
                }
                generatedSchema += "]";
            }else if(Object.prototype.toString.call(schema[key][0]).slice(8, -1) === 'Object'){
                if(!first)generatedSchema += ",";
                generatedSchema+="\n"+currIndent+key+": [";
                    generatedSetters+=  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
                                currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
                                currIndent+indent+indent+"for (var elem in value){\n" ;
                      generatedSetters +=currIndent+indent+"var validators={};\n";
                        generatedSetters +=currIndent+indent+"var msg=\"\";\n";
                       generatedSetters +=currIndent+indent+"if(Object.prototype.toString.call(value[elem]).slice(8, -1) === 'Object'){\n"+
                                           currIndent+indent+indent+"this."+key+" = value;\n"+
                                           currIndent+indent+"}else{\n"+
                                           currIndent+indent+indent+"return \"" + key + " =\" + value + \" does not conform to [" + schema[key][0] + "]\\n\";\n"+
                                           currIndent+indent+"}\n";
                    generateObject("",schema[key][0],true);
                    generatedSchema+="\n"+currIndent+indent+"]";
                     generatedSetters+=currIndent+indent+indent+"}\n" +
                                 currIndent+indent+"if(msg === \"\"){\n" +
                                 currIndent+indent+indent+"return \"\";\n"+
                                 currIndent+indent+"}\n" +
                                 currIndent+indent+"return msg;\n"+
                                           currIndent+indent+indent+"this." + key + " = value;\n" +
                                           currIndent+indent+indent+"return \"\";\n" +
                                           currIndent+indent+"}else{\n"+
                                           currIndent+indent+indent+"return \""+key+"=\" + value + \" does not conform to [array]\\n\";\n"+
                                           currIndent+indent+"}\n"+
                                           currIndent+"};\n";
            }else if(Object.prototype.toString.call(schema[key][0]).slice(8, -1) === 'Array'){
                if(!first)generatedSchema += ",";
                 generatedSchema += "\n"+currIndent + key + ":";
                  generatedSetters += generateArray(key, schema[key]);

                // generatedSchema += ",";
                 //normal array of core types
            }else{
                    if(!first)generatedSchema += ",";
                    generatedSchema += "\n"+currIndent + key + ":[";
                    generatedSetters += generateArray(key, schema[key]);
                    //generatedSchema += "\n"+currIndent + key + ": [\"" + schema[key] + "\"],";
            }
         }else if (Object.prototype.toString.call(schema[key]).slice(8, -1) === 'Object'){
            if(!first)generatedSchema += ",";
            generateObject(key,schema[key],false);
         }
         else{
            if(!first)generatedSchema += ",";
            generatedSetters += generateSetter(key, schema[key]);
            generatedSchema += "\n"+currIndent + key + ": \"" + schema[key] + "\"";
      }
    }
    first=0;
  }

    currIndent=currIndent.substring(0,currIndent.length-2);
  generatedSchema += "\n"+currIndent+"},\n";
  var returnString=  indent+"create: function(){\n" +
          indent+indent+"return{\n" +
          generatedSchema +
          indent+indent+indent+"validate: function(strict){\n" +
          indent+indent+indent+indent+"var validators = {};\n" +
          indent+indent+indent+indent+"var msg = \"\";\n";
          if(isArray){
            returnString+=indent+indent+indent+indent+" for(var index in this){\n"+
            indent+indent+indent+indent+"if(Object.prototype.toString.call(this[index]).slice(8, -1) === 'Object' && index !=='jschema'){\n";
          }
          returnString+=generatedSetters;
          if(isArray){
            returnString+=indent+indent+indent+indent+"if (strict){\n"+
            indent+indent+indent+indent+indent+"for(var key in this[index]){\n"+
            indent+indent+indent+indent+indent+indent+"if(!this.jschema[key] && Object.prototype.toString.call(this[index][key]).slice(8, -1) !== \'Function\' && key!=\"jschema\"){\n"+
            indent+indent+indent+indent+indent+indent+indent+"msg += \"Key \"+key+\" not defined in JSchema. Strict flag only allows keys defined in JSchema.\";\n"+
            indent+indent+indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+"for(var key in validators){\n" ;
           // indent+indent+indent+indent+indent+"if(strict){\n";
          }else{
            returnString+=indent+indent+indent+indent+"if (strict){\n"+
            indent+indent+indent+indent+indent+"for(var key in this){\n"+
            indent+indent+indent+indent+indent+indent+"if(!this.jschema[key] && Object.prototype.toString.call(this[key]).slice(8, -1) !== \'Function\' && key!=\"jschema\"){\n"+
            indent+indent+indent+indent+indent+indent+indent+"msg += \"Key \"+key+\" not defined in JSchema. Strict flag only allows keys defined in JSchema.\";\n"+
            indent+indent+indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+"}\n"+
            indent+indent+indent+indent+"for(var key in validators){\n" ;
            //indent+indent+indent+indent+indent+"if(strict){\n";

          }
          if(isArray){
            returnString+=indent+indent+indent+indent+indent+indent+"if(this.jschema[key] && this[index][key]){\n" +
            indent+indent+indent+indent+indent+indent+indent+"msg += validators[key](this[index][key]);\n";
            //indent+indent+indent+indent+indent+indent+"}\n" +
           // indent+indent+indent+indent+indent+"}else{\n"+
            //indent+indent+indent+indent+indent+indent+"if(this[index][key]){\n" +
           // indent+indent+indent+indent+indent+indent+indent+"msg += validators[key](this[index][key]);\n" +
           // indent+indent+indent+indent+indent+indent+"}\n";
          }else{
          returnString+=indent+indent+indent+indent+indent+indent+"if(this.jschema[key] && this[key]){\n" +
                      indent+indent+indent+indent+indent+indent+indent+"msg += validators[key](this[key]);\n";
                     // indent+indent+indent+indent+indent+indent+"}\n" +
                      //indent+indent+indent+indent+indent+"}else{\n"+
                    //  indent+indent+indent+indent+indent+indent+"if(this[key]){\n" +
                     // indent+indent+indent+indent+indent+indent+indent+"msg += validators[key](this[key]);\n" +
                      //indent+indent+indent+indent+indent+indent+"}\n";
          }
          returnString+=indent+indent+indent+indent+indent+"}\n"+
          indent+indent+indent+indent+"}\n" ;
          if(isArray){
            returnString+=indent+indent+indent+indent+"}\n" +
           indent+indent+indent+indent+"}\n";
          }
          returnString+=indent+indent+indent+"if(msg === \"\"){\n" +
          indent+indent+indent+indent+indent+"return \"Valid\";\n"+
          indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"return msg;\n"+
          indent+indent+indent+"},\n" +
          indent+indent+indent+"toJSON: function(){\n" +
          indent+indent+indent+indent+"var toJson = {};\n" +
          indent+indent+indent+indent+"for (var key in this){\n" +
          indent+indent+indent+indent+indent+"if (this.hasOwnProperty(key) && key!==\"jschema\" &&\n"+
          indent+indent+indent+indent+indent+indent+"Object.prototype.toString.call(this[key]).slice(8, -1) !== 'Function') {\n" +
          indent+indent+indent+indent+indent+indent+"toJson[key] = this[key];\n" +
          indent+indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"}\n" +
          indent+indent+indent+indent+"return JSON.stringify(toJson);\n" +
          indent+indent+indent+"}\n" +
          indent+indent+"};\n" +
          indent+"},\n";
    return returnString;
}

function generateValidator(type){
  switch(type){
    case "@string" :
      // https://toddmotto.com/understanding-javascript-types-and-reliable-type-checking/
      return "Object.prototype.toString.call(value).slice(8, -1) === 'String'";
    case "@boolean" :
      return "Object.prototype.toString.call(value).slice(8, -1) === 'Boolean'";
    case "@date" :
      return "Date.parse(value)===Date.parse(value)";
    case "@uri" :
      // json_to_schema.js
      return " /^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})).?)(?::\\d{2,5})?(?:[/?#]\\S*)?$/i.test( value )"
    case "@int" :
      return "Object.prototype.toString.call(value).slice(8, -1) === 'Number' && value%1===0";
    case "@number" :
      return "Object.prototype.toString.call(value).slice(8, -1) === 'Number'";
    default: // wildcard
        return "True";
  }
}
function generateArrayValidator(type){
  switch(type){
    case "@string" :
      generatedSchema+="\""+type+"\"";
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'String'";
    case "@boolean" :
      generatedSchema+="\""+type+"\"";
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'Boolean'";
    case "@date" :
     generatedSchema+="\""+type+"\"";
      return "Date.parse(value[elem])!==Date.parse(value[elem])";
    case "@uri" :
      generatedSchema+="\""+type+"\"";
      return "!( /^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})).?)(?::\\d{2,5})?(?:[/?#]\\S*)?$/i.test( value[elem] ))"
    case "@int" :
      generatedSchema+="\""+type+"\"";
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'Number' && value%1!==0";
    case "@number" :
      generatedSchema+="\""+type+"\"";
        //to support ecma 5 cannot use Number.isNan
      return "Object.prototype.toString.call(value[elem]).slice(8, -1) !== 'Number'";
    case "*":
       return "Wildcard"
    default: // wildcard
        //check if enumeration
       /* if(Object.prototype.toString.call(type).slice(8, -1) === 'String'){
            return "enum";
        }
        return "True";*/
  }
  //Special case array of arrays
  if(Object.prototype.toString.call(type).slice(8,-1)==='Array'){
  return "Array";
  }else if (Object.prototype.toString.call(type).slice(8,-1)==='Object'){
  return "Object";
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
function generateNestedLoop(key,type){
currIndent+="  ";
generatedSchema += "[";
var strArray="";
var validation=generateArrayValidator(type[0]);
 if(validation==='Array'){
    strArray+=currIndent+indent+indent+"if(Object.prototype.toString.call(value[elem]).slice(8, -1) === \'Array\'){\n"+
              currIndent+indent+indent+indent+"value = value[elem];\n"+
              currIndent+indent+indent+indent+"for (var elem in value){\n"+
              generateNestedLoop(key,type[0])+
              currIndent+indent+indent+indent+"}\n"+
              currIndent+indent+indent+"}else{\n"+
              currIndent+indent+indent+indent+"return \""+key+"=\" + value + \" does not conform to [array]\\n\";\n"+
              currIndent+indent+indent+"}\n";
 }else{
    strArray+=currIndent+indent+indent+indent+"if(" + validation + "){\n" +
              currIndent+indent+indent+indent+indent+"return \"" + key + " =[\" + value + \"] does not conform to [" + type + "]\\n\";\n"+
              currIndent+indent+indent+indent+"}\n";
 }
 currIndent=currIndent.substring(0,currIndent.length-2);
 generatedSchema += "]";
 return strArray;

}
function generateArray(key,type){
    if(type.length<1) return "ERROR: Invalid JSchema Format";
    var validation=generateArrayValidator(type[0]);
    var strArray;
    if(validation ==="Wildcard"){
      strArray=  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
                currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
                currIndent+indent+indent+"var type=Object.prototype.toString.call(value[0]).slice(8, -1);"+
                currIndent+indent+indent+"for (var elem in value){\n" +
                currIndent+indent+indent+indent+"if(Object.prototype.toString.call(value[elem]).slice(8, -1)!==type){\n" +
                currIndent+indent+indent+indent+indent+"return \"" + key + " =[\" + value + \"] does not conform to [" + type + "]\\n\";\n" +
                currIndent+indent+indent+indent+"}\n" +
                currIndent+indent+indent+"}\n" +
                currIndent+indent+indent+"this." + key + " = value;\n" +
                currIndent+indent+indent+"return \"\";\n" +
                currIndent+indent+"}else{\n"+
                currIndent+indent+indent+"return \""+key+"=\" + value + \" does not conform to ["+ type+"]\\n\";\n"+
                currIndent+indent+"}\n"+
                currIndent+"};\n";
                generatedSchema += "]";
    }
    else if(validation!=="Array"){
            strArray=  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
            currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
            currIndent+indent+indent+"for (var elem in value){\n" +
            currIndent+indent+indent+indent+"if(" + validation + "){\n" +
            currIndent+indent+indent+indent+indent+"return \"" + key + " =[\" + value + \"] does not conform to [" + type + "]\\n\";\n" +
            currIndent+indent+indent+indent+"}\n" +
            currIndent+indent+indent+"}\n" +
            currIndent+indent+indent+"this." + key + " = value;\n" +
            currIndent+indent+indent+"return \"\";\n" +
            currIndent+indent+"}else{\n"+
            currIndent+indent+indent+"return \""+key+"=\" + value + \" does not conform to ["+ type+"]\\n\";\n"+
            currIndent+indent+"}\n"+
            currIndent+"};\n";
            generatedSchema += "]";
     }else{
            strArray=  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
            currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
            currIndent+indent+indent+"for (var elem in value){\n" ;
            strArray+=generateNestedLoop(key,type);
            strArray+=currIndent+indent+indent+"}\n" +
                       currIndent+indent+indent+"this." + key + " = value;\n" +
                       currIndent+indent+indent+"return \"\";\n" +
                       currIndent+indent+"}else{\n"+
                       currIndent+indent+indent+"return \""+key+"=\" + value + \" does not conform to [array]\\n\";\n"+
                       currIndent+indent+"}\n"+
                       currIndent+"};\n";
     }
    return strArray;
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
        genEnum+=currIndent+indent+"}\n";
        genEnum+=currIndent+indent+"this." + key + " = value;\n";
        genEnum+=currIndent+indent+"return \"\";\n";
        genEnum+=currIndent+"};\n";

    return genEnum;
}

function generateObject(name,type,isArray){

  if(name!==""){
    if(isArray){
       generatedSchema +="\n"+ currIndent + name + ": [{";
    }else{
       generatedSchema += "\n"+currIndent + name + ": {";
    }
    currIndent+="  ";
    generatedSetters +=currIndent+"validators[\"" + name + "\"] = function(value){\n";
  generatedSetters +=currIndent+indent+"var validators={};\n";
  generatedSetters +=currIndent+indent+"var msg=\"\";\n";
  generatedSetters +=currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === 'Object'){\n"+
                     currIndent+indent+indent+"this."+name+" = value;\n"+
                     currIndent+indent+"}else{\n"+
                     currIndent+indent+indent+"return \"" + name + " =\" + value + \" does not conform to " + type + "\\n\";\n"+
                     currIndent+indent+"}\n";
  }else{
    generatedSchema += "\n"+currIndent+"{";
  }


var first=1;
  for(var key in type){
    if (type.hasOwnProperty(key)){
       if(Object.prototype.toString.call(type[key]).slice(8, -1) === 'Array'){
                /*edge case->empty arrays*/
                 //check if enum or regular array
         if(type[key][0] !== '@string' && type[key][0] !=='*' && Object.prototype.toString.call(type[key][0]).slice(8, -1) === 'String'){
             generatedSetters += generateEnum(key, type[key]);
             if(!first)generatedSchema += ",";
             generatedSchema += "\n"+currIndent + key + ": [";
             for (var elem in type[key]){
                if(elem!=0){
                   generatedSchema += ", ";
                }
                generatedSchema += "\"" + type[key][elem] + "\"";
             }
             generatedSchema += "]";

          }else if(Object.prototype.toString.call(type[key][0]).slice(8, -1) === 'Object'){
                if(!first)generatedSchema += ",";
                generatedSchema+="\n"+currIndent+key+": [";
                    generatedSetters+=  currIndent+"validators[\"" + key + "\"] = function(value){\n" +
                                currIndent+indent+"if(Object.prototype.toString.call(value).slice(8, -1) === \'Array\'){\n" +
                                currIndent+indent+indent+"for (var elem in value){\n" ;
                      generatedSetters +=currIndent+indent+"var validators={};\n";
                        generatedSetters +=currIndent+indent+"var msg=\"\";\n";
                       generatedSetters +=currIndent+indent+"if(Object.prototype.toString.call(value[elem]).slice(8, -1) === 'Object'){\n"+
                                           currIndent+indent+indent+"this."+key+" = value;\n"+
                                           currIndent+indent+"}else{\n"+
                                           currIndent+indent+indent+"return \"" + key + " =\" + value + \" does not conform to [" + type[key][0] + "]\\n\";\n"+
                                           currIndent+indent+"}\n";
                    generateObject("",type[key][0],true);
                    generatedSchema+="\n"+currIndent+indent+"]";
                     generatedSetters+=currIndent+indent+indent+"}\n" +
                                 currIndent+indent+"if(msg === \"\"){\n" +
                                 currIndent+indent+indent+"return \"\";\n"+
                                 currIndent+indent+"}\n" +
                                 currIndent+indent+"return msg;\n"+
                                           currIndent+indent+indent+"this." + key + " = value;\n" +
                                           currIndent+indent+indent+"return \"\";\n" +
                                           currIndent+indent+"}else{\n"+
                                           currIndent+indent+indent+"return \""+key+"=\" + value + \" does not conform to [array]\\n\";\n"+
                                           currIndent+indent+"}\n"+
                                           currIndent+"};\n";
          }else if(Object.prototype.toString.call(type[key][0]).slice(8, -1) === 'Array'){
                if(!first)generatedSchema += ",";
                 generatedSchema += "\n"+currIndent + key + ":";
                  generatedSetters += generateArray(key, type[key]);

          }else{
                 if(!first)generatedSchema += ",";
                 generatedSchema += "\n"+currIndent + key + ":[";
                 generatedSetters += generateArray(key, type[key]);
          }
       }else if (Object.prototype.toString.call(type[key]).slice(8, -1) === 'Object'){
                if(!first)generatedSchema += ",";
                generateObject(key,type[key],false);
       }else{
               currIndent+="  ";
               generatedSetters += generateSetter(key, type[key]);
               currIndent=currIndent.substring(0,currIndent.length-2);
               if(!first)generatedSchema += ",";
               generatedSchema += "\n" + currIndent + key + ": \"" + type[key] + "\"";
       }
       first=0;
    }
  }
  if(isArray){
  generatedSchema+="\n"+currIndent+"}";
  }else{
    generatedSchema+="\n"+currIndent+"}";
  }
if(name!==""){
   generatedSetters+=currIndent+indent+"for(var key in validators){\n" +
            currIndent+indent+indent+"if(value[key]){\n" +
            currIndent+indent+indent+indent+"msg += validators[key](value[key]);\n" +
            currIndent+indent+indent+"}\n" +
            currIndent+indent+"}\n" +
            currIndent+indent+"if(msg === \"\"){\n" +
            currIndent+indent+indent+"return \"\";\n"+
            currIndent+indent+"}\n" +
            currIndent+indent+"return msg;\n";
            generatedSetters+=currIndent+"};\n" ;
}else{
generatedSetters+=currIndent+indent+"for(var key in validators){\n" +
            currIndent+indent+indent+"if(value[elem][key]" +
            "|| Object.prototype.toString.call(value[elem][key] ).slice(8, -1) === \'Boolean\'){\n"+
            currIndent+indent+indent+indent+"msg += validators[key](value[elem][key]);\n" +
            currIndent+indent+indent+"}\n" +
            currIndent+indent+"}\n"+
            currIndent+indent+"if(msg !== \"\"){\n" +
            currIndent+indent+indent+"return msg;\n"+
            currIndent+indent+"}\n" ;
}

  currIndent=currIndent.substring(0,currIndent.length-2);

}