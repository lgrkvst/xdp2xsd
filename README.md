
xdp2xsd
=======

###Solving the problem of creating schema files for your LiveCycle business forms

"xdp to xsd" is a node.js command line utility that converts xdp (Adobe XFA forms) to xsd (xml schema).

####Usage
`$ node xdp2xsd business_form.xdp > business_form.xsd` 

For the time being, functionality is limited to the uttermost basics:

* Every field becomes a text field
* Occurencies of subforms
* Auto-pruning of subtrees that don't end up in field leaves

There's also an option found in the top of xdp2xsd.js: `SLOPPY_DATA_BINDING [true]`: Say you have a LiveCycle process that accepts xml data which will eventually be merged with a business form. As a consumer, you would probably expect to be able to skip certain fields, or entire subforms for that matter, and settle for data binding of the sloppier kind...

#### To-do

Other than the issue section:

* Clean up
* Write tests
* Frankly I'm ashamed of my solution for pruning "dead" subtrees (the ones that don't end up with a &lt;field&gt; leaf).

> Written by [Christian Lagerkvist](https://github.com/o-o-).

#### License
MIT
