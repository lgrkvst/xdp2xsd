// example:
// $ node xdp2xsd testing/1.xdp
"use strict";
/*
	TODO Handle fragments referenced by master pages

*/

var fs = require('fs')
var xml2json = require('xml2json');
var outpath = 'xsd';
var FP = require('filepath')
var xdp = require('./xdp');
var slash = require('slash');
var log4js = require('log4js'); 
var logger = log4js.getLogger(); // default is console


var util = require('util');
function L(o) {
	console.log(util.inspect(o, {showHidden: false, depth: null}));
};

var rootSubform = read_xdp(process.argv[2]);
console.log(xdp.writeXML({'targetNamespace': 'http://domain.com/'+rootSubform, 'elementFormDefault': 'qualified'}));

/*
input can be either a filepath to an xdp form or a filepath followed by a somExpression.
This allows you to create schemas for individual subforms (e.g. fragments)
*/

function read_xdp(input, overridden_binding) {
	if (typeof input == "string") {
		var path_somExpression = input.split("#som($template.");
		var path = FP.newPath(slash(path_somExpression[0]));
		var somExpression = path_somExpression[1];
		
		if (path.isFile()) {
			process.chdir(path.dirname().toString());
		} else {
			//logger.error("read_xdp::path.isFile(): " + path.toString() + " is not a valid path (cwd is " + process.cwd() + ")")
		}

		var data = fs.readFileSync(path.basename().toString(), 'utf8');
		// oo as in multiple o[bject]
		var oo = xml2json.toJson(data, {
			object: true,
			arrayNotation: true
		});
		
		var oo = oo["xdp:xdp"][0]["template"][0];
		if (somExpression) { // (template.)form1.signatur
			try {
				oo = traverseCursor(oo, somExpression);
			} catch (e) {
				if (e.name=="MISSING_NODE") {
					logger.fatal(path.toString() + " has no node " + e.message);
					process.exit();
				}
			}
		} else {
			oo = oo["subform"][0];
		}
		logger.info("Appending " + slash(input));
		subform(oo, input, overridden_binding);
	}
	return oo["name"];
}

function traverseCursor(oo, somExpression) {
	somExpression = somExpression.substring(0, somExpression.length-1).split('.');
	for (var i=0; i<somExpression.length; i++) {
		var notFound = true, j=0, xdpindex=0, jsonindex=0;
		
		var matches = somExpression[i].match(/([a-z0-9_]+)\[(\d+)\]/i);
		if (matches) {
			somExpression[i] = matches[1];
			xdpindex = matches[2];
			logger.warn("Fragment " + somExpression[i] + " is referenced through index instead of unique name.");			
		} else {
			jsonindex=0;
		}
		
		try {
			oo = oo["subform"];
		} catch (e) {
			L("AARGH");
			process.exit();
		}
		
		while(notFound && j<oo.length) {
			if (oo[j]["name"]==somExpression[i]) {
				if (xdpindex == jsonindex) {
					oo = oo[j];
					jsonindex=0;
					xdpindex=0;
					notFound = false;
				} else {
					jsonindex++;					
				}
			}
			j++;
		}
		if (notFound) {
			throw {
				name: "MISSING_NODE",
				message: somExpression[i]
			}
		}
	}
	return oo;
}


function subform(oo, path_som, overridden_binding) {
	var bound =  xdp.openSubform(oo, overridden_binding);
	
	for (var o in oo) {
		if (path_som.split("#").length == 2) {
//			logger.trace("working on " + o);
		}
		
		if (o === "subform") {
			for (var i=0; i<oo[o].length; i++) {
				if (oo[o][i]["usehref"]) {
					read_xdp(oo[o][i]["usehref"], bound);
				}
				subform(oo[o][i], path_som);
			}
		}
		if (o === "field") {
			for (var i=0; i<oo[o].length; i++) {
				if (oo[o][i]["bind"] && oo[o][i]["bind"][0]["match"] == "none") break;
				if (oo[o][i]["usehref"]) {
					logger.warn("overridden field:");
					L(oo[o][i]);
					read_xdp(oo[o][i]["usehref"], oo[o][i]["name"]);
				}
				if (oo[o][i]["ui"]) {
					var ui;
					for (var tmp in oo[o][i]["ui"][0]) {
						ui = tmp;
					}
				}
				xdp.addField(oo[o][i]["name"], ui);
			}
		}
	}
	
	if (bound) { /* close Subform if bound, i.e. opened */
		xdp.closeSubform(oo["name"]);
	}
}