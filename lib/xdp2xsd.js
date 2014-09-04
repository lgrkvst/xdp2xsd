// example:
// $ node xdp2xsd testing/1.xdp

var fs = require('fs')
var xml2json = require('xml2json');
var XMLWriter = require('xml-writer');
var xw = new XMLWriter(1);
var util = require('util');

var outpath = 'xsd';
var VERBOSE = true;

// helper
function isArray(test_me) {
	return (Object.prototype.toString.call(test_me) === '[object Array]');
}

function L(o) {
	if (VERBOSE) {
		console.log(util.inspect(o, {showHidden: false, depth: null}));
	}
};

var filepath = process.argv[2];

if (typeof filepath == "string") {
	var data = fs.readFileSync(filepath, 'utf8');
	var json = xml2json.toJson(data, {
		object: true,
		arrayNotation: true
	});
	
	var root = json["xdp:xdp"][0]["template"][0]["subform"][0];
    xw.startDocument('1.0', 'UTF-8');

    xw.startElement('schema');
	xw.writeAttribute('xmlns', 'http://www.w3.org/2001/XMLSchema');
	xw.writeAttribute('targetNamespace', 'http://domain.com/' + root["name"]);
	xw.writeAttribute('elementFormDefault', 'qualified');
	subform(root, -1);
	xw.endElement();
	xw.endElement();
    xw.endDocument();

   console.log(xw.toString());
}

function T(t) {
	var str = "";
	for (var i = 0; i<t; i++) str+="\t";
	return str;
}

function subform(oo, depth) {
	depth++;
	var bind = 1;

	try {
		if (oo["bind"][0]["match"] == "none") {
			bind = 0;
		} 
	} catch(e) {}
	
	if (bind && typeof oo["name"] == "string") {
		xw.startElement("element");
	   	xw.writeAttribute('name', oo["name"]);
		xw.startElement("complexType");
		xw.startElement("sequence");
	}

	for (var o in oo) {

		if (o === "subform") {
			for (var i=0; i<oo[o].length; i++)
			subform(oo[o][i], depth);
		}

		if (o === "field") {
			for (var i=0; i<oo[o].length; i++) {
				if (oo[o][i]["bind"] && oo[o][i]["bind"][0]["match"] == "none") break;
				
				xw.startElement("element");
				xw.writeAttribute('name', oo[o][i]["name"]);
				if (oo[o][i]["ui"]) {
					for (var tmp in oo[o][i]["ui"][0]) {
						switch (tmp) {
						default:
							xw.writeAttribute('type', 'string');
						}
					}
				}
				xw.endElement();				
			//	if (oo[o][i]["name"] == "DATUM") L(oo[o][i]);
			}
		}

	}

	if (bind && typeof oo["name"] == "string") {
		xw.endElement();
		xw.endElement();
		xw.endElement();
	}

}