
xdp2xsd
=======

###Solving the problem of creating schemas for your LiveCycle business forms

"xdp to xsd" is a node.js command line utility that converts xdp (Adobe XFA forms) to xsd (xml schema).

####Usage
`$ node xdp2xsd business_form.xdp > business_form.xsd` 

For the time being, functionality is limited to the uttermost basic:

* Every field becomes a text field
* Respecing occurence count of subforms
* Auto-pruning of subtrees that don't end up in field leaves
* Fragment support (usehref) including support for overridden subform bindings
* xsd is generated inline, i.e. no types/references

There's also an option found in the top of xdp.js: `STRICT_BINDING [false]`: Say you have a LiveCycle process that accepts xml data, which will eventually be merged with an xdp business form. As a consumer of that service, you  probably expect being able to skip certain fields (or entire subforms for that matter) and settle for data binding of the sloppier kind.

A note on forms using fragments: make sure you apply unambiguous naming to fragments, or you will have a form repository maintenance nightmare once you start adding, removing or reordering fragments in the fragment file. (If you keep it to one fragment per fragment file, this shouldn't be an issue.) xdp2xsd does support fragment "array" references like 'form.customer_fragment[3]', but I encourage you to avoid this naming convention.

#### To-do

Other than the issue section:

* Clean up
* Write tests

> Written by [Christian Lagerkvist](https://github.com/o-o-).

#### License
MIT
