// example:
// $ node xdp2xsd testing/1.xdp

var fs = require('fs')
var xml2json = require('xml2json');
var XMLWriter = require('xml-writer');
var xw = new XMLWriter(1);
var util = require('util');
var outpath = 'xsd';
var DEFAULT_XDP_FIELD_UI = 'textEdit';
var SLOPPY_DATA_BINDING = true; // set minOccurs = "0" in order to allow Livecycle inbound xml to skip arbitrary subforms

function L(o) {
	console.log(util.inspect(o, {showHidden: false, depth: null}));
};

var filepath = process.argv[2];

var xdp = function() {
	var arr = [];
	return {
		addField: function(n, ui) {
			return arr.push(["field", n, ui]);
		},
		openSubform: function(oo) {
			var bind = true;
			var minOccurs = maxOccurs = 1;
			try {
				if (oo["bind"][0]["match"] == "none") {
					bind = false;
				} 
			} catch (e) {}
	
			if (bind && typeof oo["name"] == "string") {
				if (oo["occur"]) {
					for (var occur in oo["occur"]) {
						switch (occur) {
							case 'min':
								minOccurs = oo["occur"][occur];
								break;
							case 'max':
								if (oo["occur"][occur] == "-1") {
									maxOccurs = "UNBOUNDED"
								}
								else maxOccurs = oo["occur"][occur];
								break;
						}
					}
				}
				arr.push(["open", oo["name"], minOccurs, maxOccurs]);
				return true;
			}
			return false;
		},
		closeSubform: function(n) {
			if (arr[arr.length-1][0] == "open") arr.pop();
			else arr.push(["close", n]);
		},
		get: function() {
			return arr;
		},
		writeXML: function() {
			for (var i = 0; i<arr.length; i++) {
				switch (arr[i][0]) {
					case 'open':
						xw.startElement("element");
					   	xw.writeAttribute('name', arr[i][1]);
						if (SLOPPY_DATA_BINDING) {
							xw.writeAttribute('minOccurs', "0");
						} else if (arr[i][2] != 1) {
							xw.writeAttribute('minOccurs', arr[i][2].toString());
						}
						if (arr[i][3] != 1) {
						   	xw.writeAttribute('maxOccurs', arr[i][3].toString());
						}
						xw.startElement("complexType");
						xw.startElement("sequence");
						break;
					case 'close':
						xw.endElement();
						xw.endElement();
						xw.endElement();
						break;
					case 'field':
						xw.startElement("element");
						xw.writeAttribute('name', arr[i][1]);
						if (SLOPPY_DATA_BINDING) {
							xw.writeAttribute('minOccurs', "0"); /* todo: required fields */
						}
						switch (arr[i][2]) {
							case 'choiceList': /* todo */
							case 'textEdit':
							default:
								xw.writeAttribute('type', 'string');
						}
						xw.endElement();
						break;
				}
			}
		}
	};
}();

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
	subform(root);
	xdp.writeXML();
	L(xdp.get());
	xw.endElement();
	xw.endElement();
    xw.endDocument();

	console.log(xw.toString());
}

function subform(oo) {
	var bound = xdp.openSubform(oo);

	for (var o in oo) {
		if (o === "subform") {
			for (var i=0; i<oo[o].length; i++)
			subform(oo[o][i]);
		}
		if (o === "field") {
			for (var i=0; i<oo[o].length; i++) {
				if (oo[o][i]["bind"] && oo[o][i]["bind"][0]["match"] == "none") break;
				if (oo[o][i]["ui"]) {
					var ui;
					for (var tmp in oo[o][i]["ui"][0]) {
						ui = tmp;
					}
				}
				/* bugfix: set bind values inherited from fragments to DEFAULT_XDP_FIELD_UI */
				if(!ui) ui = DEFAULT_XDP_FIELD_UI;
				xdp.addField(oo[o][i]["name"], ui);
			}
		}
	}
	
	if (bound) { /* close Subform if bound, i.e. opened */
		xdp.closeSubform(oo["name"]);
	}
}