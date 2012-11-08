(function () {
	//reload the qunit script with every test run (makes the tests atomic)
	QUnit.testStart(function () {
		var script = document.querySelector("script[src^='../blitz.js']");
		script.parentNode.removeChild(script);
		script = document.createElement("script");
		script.src = "../blitz.js?" + Date.now();
		script.type = "text/javascript";
		script.onload = function () {
			start();
		};
		document.head.appendChild(script);
		stop();
	});
	test("blitz.isConstructor", 38, function () {
		equal(blitz.isConstructor(RegExp), true, "RegExp constructor");
		equal(blitz.isConstructor(Array), true, "Array constructor");
		equal(blitz.isConstructor(Date), true, "Date constructor");
		equal(blitz.isConstructor(Object), true, "Object constructor");
		equal(blitz.isConstructor(Function), true, "Function constructor");
		equal(blitz.isConstructor(Error), true, "Error constructor");
		equal(blitz.isConstructor(EvalError), true, "EvalError constructor");
		equal(blitz.isConstructor(RangeError), true, "RangeError constructor");
		equal(blitz.isConstructor(ReferenceError), true, "ReferenceError constructor");
		equal(blitz.isConstructor(SyntaxError), true, "SyntaxError constructor");
		equal(blitz.isConstructor(TypeError), true, "TypeError constructor");
		equal(blitz.isConstructor(URIError), true, "URIError constructor");
		equal(blitz.isConstructor(Element), true, "Element constructor");
		equal(blitz.isConstructor(String), true, "String constructor");
		equal(blitz.isConstructor(Number), true, "Number constructor");
		equal(blitz.isConstructor(Boolean), true, "Boolean constructor");
		equal(blitz.isConstructor(HTMLElement), true, "HTMLElement constructor");
		equal(blitz.isConstructor(Window), true, "Window constructor");
		equal(blitz.isConstructor(XMLHttpRequest), true, "XMLHttpRequest constructor");
		equal(blitz.isConstructor(HTMLCollection), true, "HTMLCollection constructor");
		equal(blitz.isConstructor(NodeList), true, "NodeList constructor");
		equal(blitz.isConstructor(Window), true, "Window constructor");
		equal(blitz.isConstructor(function () {}), true, "An anonymous function");
		equal(blitz.isConstructor(JSON), false, "The JSON object");
		equal(blitz.isConstructor(location), false, "The location object");
		equal(blitz.isConstructor(isNaN), false, "The isNaN function");
		equal(blitz.isConstructor(NaN), false, "NaN");
		equal(blitz.isConstructor(Infinity), false, "Infinity");
		equal(blitz.isConstructor(window), false, "The window object");
		equal(blitz.isConstructor([]), false, "An Array object");
		equal(blitz.isConstructor(arguments), false, "An Arguments object");
		equal(blitz.isConstructor(""), false, "A string");
		equal(blitz.isConstructor(9), false, "A number");
		equal(blitz.isConstructor(true), false, "A boolean");
		equal(blitz.isConstructor(/./), false, "A RegExp object");
		equal(blitz.isConstructor(document.body), false, "document.body");
		equal(blitz.isConstructor(document.body.children), false, "An HTMLCollection object");
		equal(blitz.isConstructor(document.body.childNodes), false, "A NodeList object");
	});

	test("blitz basics", 3, function () {
		var blitzObj = blitz("");
		equal(blitzObj, blitz(blitzObj), "blitz should return the object passed in when a blitz object is passed in");
		strictEqual(undefined, blitz(undefined), "blitz should return undefined when undefined is passed in");
		strictEqual(null, blitz(null), "blitz should return null when null is passed in");
	});
	
	test("blitz accuracy of native methods and properties", 8, function () {
		function A() {}
		A.prototype = {
			test : function () {
				return "test";
			},
			overrideMe : "please"
		}
		
		function B() {}
		B.prototype = new A;
		B.prototype.constructor = B;
		B.prototype.test2 = function () {
			return "test2";
		}
		B.prototype.overrideMe = "done";
		
		var str = "123456789",
			array = str.split(""),
			reg = /./,
			a = new A,
			b = new B;
		
		ok(typeof blitz(array).length == "function" && blitz(array).length().value == array.length, "Array 'length'");
		ok(typeof blitz(str).substr == "function" && blitz(str).substr(3).value == str.substr(3), "String 'substr'");
		ok(typeof blitz(reg).test == "function" && blitz(reg).test("a").value == reg.test("a"), "RegExp 'test'");
		ok(typeof blitz(a).test == "function" && blitz(a).test().value == a.test(), "Custom type. Part 1");
		ok(typeof blitz(b).test == "function" && blitz(b).test().value == b.test(), "Custom type. Part 2");
		ok(typeof blitz(b).test2 == "function" && blitz(b).test2().value == b.test2(), "Custom type. Part 3");
		ok(typeof blitz(a).overrideMe == "function" && blitz(a).overrideMe().value == a.overrideMe, "Custom type. Part 4");
		ok(typeof blitz(b).overrideMe == "function" && blitz(b).overrideMe().value == b.overrideMe, "Custom type. Part 5");
	});			

	test("blitz.extend", 5, function () {
		//add a new extension method on to Arrays
		blitz.extend({
			type: Array,
			ext : {
				first : function () {
					return this.value[0];
				},
				thisNotArray : function () {
					return !Array.isArray(this);
				}
			}
		});
		
		//Get an array from another window
		var iframe = document.createElement("iframe");
		document.head.appendChild(iframe);
		var foreignArray = new iframe.contentWindow.Array(7, 1, 2),
			foreignOption = iframe.contentWindow.document.createElement("option");
		iframe.parentNode.removeChild(iframe);
		
		blitz.extend({
			type : foreignOption,
			ext : {
				test : function () {
					return 8;
				}
			}
		});	

		var option = document.createElement("option");
		
		ok(typeof blitz([7, 1, 2]).first == "function" && blitz([7, 1, 2]).first().value === 7, "'first' method is added onto the array blitztype prototype and works");
		ok(typeof blitz(foreignArray).first == "function" && blitz(foreignArray).first().value === 7, "'first' method works on an array from another context window");
		ok(typeof blitz([]).thisNotArray == "function" && blitz([]).thisNotArray().value === true, "Verify the this value in the extension method is not an array");
		ok(typeof blitz(foreignOption).test == "function" && blitz(foreignOption).test().value === 8, "Verify the foreign 'option' has its 'test' method");
		ok(typeof blitz(option).test == "function" && blitz(option).test().value == 8, "Verify that 'option' has its 'test' method");
	});

	function overloadAssertions(overload) {
		equal(overload([]), "type1", "One type-bound argument");
		equal(overload(3, ""), "types2", "Two type-bound arguments");
		equal(overload(/./, ""), "types3", "Two type-bound arguments where the second parameter can be different types. Part 1");
		equal(overload(/./), "types3", "Two type-bound arguments where the second parameter can be different types. Part 2");
		equal(overload(/./, undefined), "types3", "Two type-bound arguments where the second parameter can be different types. Part 3");
		equal(overload(false, undefined, 3), "types4", "Three type-bound arguments where the second argument can be multiple types. Part 1");
		equal(overload(true, "", 8), "types4", "Three type-bound arguments where the second argument can be multiple types. Part 2");
		equal(overload(true), "default", "The fallback function 'default' is called. Part 1");
		equal(overload(), "default", "The fallback function 'default' is called. Part 2");	
		equal(overload(1, 2, 3, 4, 5), "5 args", "Five non-type-bound arguments");	
	}

	test("blitz.overload using constructors", 10, function () {
		var overload = blitz.overload({
			type1 : Array,
			fn1 : function () {
				return "type1";
			},
			types2 : [Number, String],
			fn2 : function () {
				return "types2";
			},
			types3 : [RegExp, [String, undefined]],
			fn3 : function () {
				return "types3";
			},
			types4 : [Boolean, [String, undefined], Number],
			fn4 : function () {
				return "types4";
			},
			5 : function () {
				return "5 args";
			},
			"default" : function () {
				return "default";
			}
		});
		overloadAssertions(overload);		
	});
	
	test("blitz.overload using instances", 10, function () {
		var overload = blitz.overload({
			type1 : [[]], //array instances must be in a type-group
			fn1 : function () {
				return "type1";
			},
			types2 : [1, ""],
			fn2 : function () {
				return "types2";
			},
			types3 : [/t/, ["", undefined]],
			fn3 : function () {
				return "types3";
			},
			types4 : [true, ["", undefined], 9],
			fn4 : function () {
				return "types4";
			},
			5 : function () {
				return "5 args";
			},
			"default" : function () {
				return "default";
			}
		});
		overloadAssertions(overload);		
	});
	
	test("blitz.intercept", 2, function () {
		var htmlCollection = document.getElementsByTagName("z"),
			nodeList = document.body.childNodes;

		blitz.intercept({
			types : [htmlCollection, nodeList],
			fn : function (o) {
				return [].slice.call(o);
			}
		});

		ok(Array.isArray(blitz(htmlCollection).value), "An HTMLCollection object is intercepted and transformed into an Array");
		ok(Array.isArray(blitz(nodeList).value), "A NodeList object is intercepted and transformed into an Array");
	});

	test("Cross-context", 6, function () {
		var iframe = document.createElement("iframe");
		document.head.appendChild(iframe);
		var span = document.createElement("div"),
			div = document.createElement("div"),
			foreignDiv = iframe.contentWindow.document.createElement("div"),
			foreignArg = iframe.contentWindow.Function("return arguments")(); //foreign arguments are used because they are of type Object but have a [[class]] of "Arguments"
		iframe.parentNode.removeChild(iframe);
		
		//register the foreign object
		blitz(foreignArg);
		//register native object
		blitz({});
		
		//extend the foreign object
		blitz.extend({
			type : foreignArg,
			ext : {
				objTest : function () {
					return "obj";
				}
			}
		});
		
		ok(typeof blitz(foreignArg).objTest == "function" && blitz(foreignArg).objTest().value == "obj", "Foreign object was extended");
		ok(typeof blitz({}).objTest == "function" && blitz({}).objTest().value == "obj", "Local object was extended");
		
		blitz.extend({
			type : foreignDiv,
			ext : {
				divTest : function () {
					return "div";
				}
			}
		});
		
		ok(typeof blitz(foreignDiv).divTest == "function" && blitz(foreignDiv).divTest().value == "div", "Foreign div was extended");
		ok(typeof blitz(div).divTest == "function" && blitz(div).divTest().value == "div", "Local div was extended. Part 1");
		
		blitz.extend({
			type : HTMLElement,
			ext : {
				htmlTest : function () {
					return "html";
				}
			}
		});
		
		ok(typeof blitz(span).htmlTest == "function" && blitz(span).htmlTest().value == "html", "Local span was extended");
		ok(typeof blitz(div).htmlTest == "function" && blitz(div).htmlTest().value == "html", "Local div was extended. Part 2");
	});
}());