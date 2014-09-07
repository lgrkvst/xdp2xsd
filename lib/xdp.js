var XMLWriter = require('xml-writer');
var xw = new XMLWriter(1);

var DEFAULT_XDP_FIELD_UI = 'textEdit';
var SLOPPY_DATA_BINDING = true; // set minOccurs = "0" in order to allow Livecycle inbound xml to skip arbitrary subforms

var xdp = function() {
	var arr = [];
	return {
		addField: function(n, ui) {
			return arr.push(["field", n, ui || DEFAULT_XDP_FIELD_UI]);
		},
		openSubform: function(oo, overridden_binding) {
			var bind = true;
			var minOccurs = maxOccurs = 1;
			try {
				if (oo["bind"][0]["match"] == "none") {
					bind = false;
				} 
			} catch (e) {}
	
			if (bind && typeof oo["name"] == "string" && !overridden_binding) {
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
				return oo["name"];
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
		writeXML: function(rootAttributes) {
		    xw.startDocument('1.0', 'UTF-8');
		    xw.startElement('schema');
			xw.writeAttribute('xmlns', 'http://www.w3.org/2001/XMLSchema');
			for (attr in rootAttributes) {
				xw.writeAttribute(attr, rootAttributes[attr]);
			}
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
			xw.endElement();
			xw.endElement();
		    xw.endDocument();

			return xw.toString();
		}
	};
}();

module.exports = xdp;