#Blitz

##What is Blitz?

Blitz is a javascript framework to better assist developers in working with
objects and prototypes. Blitz offers:

*	A safe way to extend native prototypes
*	Function overloading based on the type and/or number of arguments
*	Native type recognition across global contexts

##Compatibility

Blitz works with ECMAScript 5 compliant browsers/environments. The following
browsers/environments have specifically been tested:

*	Internet Explorer 9/10
*	Firefox
*	Chrome
*	Opera

##The Docs
<a id="basics"></a>
###The Basics

Blitz creates a Blitz prototype for every object prototype that it encounters. A
Blitz object acts as a wrapper around other object types, even cloning their
prototype chain. So, to be technically accurate Blitz prototypes, not native
prototypes, are extended.

**How is Blitz different from other frameworks that create object wrappers?**  

Unlike other frameworks that have one generic wrapper for every object, Blitz
creates unique wrappers for every prototype. So, for example, instead of
having one method `replace` that works only with `Arrays` we can have a
`replace` method for `Arrays` another for `HTMLElements` and/or any other object
type.

Another difference is that a Blitz object provides direct access to a wrapped
object's methods and properties. **Note:** wrapped object's properties are
accessible as methods rather than properties. To get the value of a property
call the method with no arguments. To set the value of a property provide a
single argument to the method. This is to aid in method chaining.

When a method returns a value, that value is also wrapped in a Blitz object. To
access the wrapped object, simply use the `value` property.

####Example 1
Accessing a wrapped string's `length` property:  
```js
//13  
blitz("I am a string").length().value;
```

####Example 2
Setting a wrapped array's `length` property:  
```js
//[35, 16]  
blitz([35, 16, 21, 9]).length(2).value;
```

####Example 3

`Array` and `String` Blitz objects both have their own `indexOf` methods:  
```js
//10  
blitz("This is a test and only a test").indexOf("test").value;  
//3  
blitz(["This", "is", "a", "test", "and", "only", "a", "test"]).indexOf("test").value;
```

<a id="extend"></a>
###Extending Native Prototypes (or rather, Blitz prototypes)

The `blitz.extend` method is used to extend Blitz prototypes. It takes a single
object as an argument which can have the following properties:

*	_type_ or _types_
*	_ext_
*	_props_

The _type_ or _types_ property is required and tells Blitz which prototype(s)
the new methods/properties are to be added to. _type_ is a single value and
_types_ is an array of values. A value can be either a constructor or an object
instance. Regardless of whether a constructor or an object instance is provided,
the extensions are added to the Blitz prototype, never to an individual
instance.

The _ext_ property contains methods/properties which are to be added to a Blitz
prototype. Properties and methods added using _ext_ are added to the prototype
as non-writeable and non-enumerable. Return values from _ext_ methods will
automatically be wrapped in a Blitz object. If the return is undefined, the
current Blitz object is returned.

The _props_ property offers more flexibility as it is an object with properties
and property descriptors. See MDN's
[Object.defineProperties](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperties).
While methods added using _ext_ will automatically have their return values
wrapped in a Blitz object, that is not done with _props_ methods. _props_
methods should wrap their returns manually by returning `this` (the Blitz
object) or `blitz(returnValue)`.

Inside any extension method the `this` value is the Blitz object. To access the
wrapped object use the `value` property.

####Example 

Add an extension method on `NodeList`, `HTMLCollection` and `Arguments` Blitz
objects to convert them to arrays:  
```js
(function () {  
	blitz.extend({  
		types : [NodeList, HTMLCollection, arguments],  
		ext : {  
			toArray : function () {  
				return [].slice.call(this.value);  
			}  
		}  
	});  
})();
```

<a id="overload"></a>
###Function Overloading

The `blitz.overload` method creates overloaded functions based on the type
and/or number of arguments. It takes a single object as an argument which can
have the following parameters:

*	_typeN_ or _typesN_
*	_fnN_
*	_N_
*	_default_

The _typeN_ or _typesN_ property represents the argument types for a linked
function. For _typeN_, a single type or type-group is provided for a single
argument. For _typesN_, a type or type-group for each argument is provided. A
type-group is an array of types where the associated argument can be any one of
the types within the array. If the last argument, or series of arguments, is
a type-group containing `undefined`, those arguments are optional. _N_
represents a numeric integer that starts at one--the first _typeN_ or _typesN_
would be _type1_ or _types1_, followed by _type2_ or _types2_ and so forth. The
_N_ value also corresponds with a matching function. Type values can be either
instances or constructors.

The _fnN_ is the function that corresponds with _typeN_ or _typesN_.

The _N_ parameter is used to match a function based on the number of arguments
provided. _N_ parameters take precedence over _typeN_ or _typesN_ properties
with same number of arguments.

The _default_ parameter is a function which is called as a fallback when none of
the other functions match the arguments provided. Remember that `default` is a
reserved word in Javascript and should be in quotes to prevent any errors.

####Example 1

Create an overloaded function which overloads based on the number of arguments,
with a default:  
```js
var overload = blitz.overload({  
	0 : function () {  
		//0 parameters provided  
	},  
	1 : function (a) {  
		//1 parameter provided  
	},  
	2 : function (a, b) {  
		//2 parameters provided  
	},  
	"default" : function () {  
		//fallback if 0, 1, or 2 parameters were not provided  
	}  
});
```

####Example 2

Create an overloaded function which overloads based on argument types (using
constructors):  
```js
var overload = blitz.overload({  
	type1 : Array,  
	fn1 : function (array) {  
		//1 parameter of type Array  
	},  
	types2 : [Array, String],  
	fn2 : function (array, string) {  
		//2 parameters of type Array and String  
	},
	types3 : [RegExp, [Array, Number, undefined]],  
	fn3 : function (reg, x) {  
		//1 or 2 parameters, first parameter is a RegExp, second parameter is an
		//Array, a Number or undefined (making the third parameter optional)  
	}
});
```

####Example 3

Create an overloaded function with overloads based on argument types (using
instances):  
```js
var overload = blitz.overload({  
	type1 : [[]],  //*See note below  
	fn1 : function (array) {  
		//1 parameter of type Array  
	},  
	types2 : [[[]], ""],  
	fn2 : function (array, string) {  
		//2 parameters of type Array and String  
	}  
	types3 : [/./, [[], 3, undefined]],  
	fn3 : function (reg, x) {  
		//1 or 2 parameters, first parameter is a RegExp, second parameter is an
		//Array, a Number or undefined (making the third parameter optional)  
	}
});
```

Notice that in the first two functions the first argument type, an Array
instance, is inside another Array, this is because when `overload`
encounters an Array it assumes a type-group.

####Example 4

Mix-match type and argument-number overload:  
```js
var overload = blitz.overload({  
	1 : function () {  
		//1 parameter, any-type  
	},  
	type1 : NodeList,  
	fn1 : function (nl) {  
		//will never be called because the above function takes precedence  
	},  
	types2 : [Number, 3],  
	fn2 : function (n, n2) {  
		//2 parameters both numbers  
	}  
});
```

##API

###`blitz`

This is the method which wraps objects in Blitz objects. If a `Blitz` object,
`null` or `undefined` are passed in, they are returned rather than being
wrapped.

See the [Basics](#basics) section.

###`blitz.extend`

See the [Extending Native Prototypes](#extend) section.

###`blitz.getPrototype`

This method returns the prototype for an object. The difference between this
method and `Object.getPrototypeOf` is this method promotes primitives (for
`null` and `undefined`, `undefined` is returned) and in the case of a
constructor the `prototype` property of the constructor is returned.

####Example

```js
//get the prototype for Element objects (constructor)  
var elementProto = blitz.getPrototype(Element),  
//get the prototype for string objects (instance)  
	stringProto = blitz.getPrototype("");  
```

###`blitz.intercept`

An intercept is called when `blitz` is called with an object of a specified
type. The intercept receives all of the arguments passed into `blitz` and
returns an object. `blitz` treats the returned object as if it was the object
originally passed in.

`blitz.intercept` takes an object with the following properties:  

*	_type_ or _types_
*	_fn_

_type_ is a value and _types_ is an array of values. A value can be any object
instance or a constructor.

_fn_ is the intercepting function that will be triggered when `blitz` is called
with an object of the specified type. The function receives all of the arguments
provided to `blitz`

####Example

Define an intercept which transforms an `Argument`, `NodeList`, or
`HTMLCollection` object to an `Array`:  
```js
blitz.intercept({  
	types : [(function () {return arguments;})(), NodeList, HTMLCollection],  
	fn : function (o) {  
		return [].slice.call(o);  
	}  
});
```

###`blitz.isConstructor`

This method determines whether an object is a constructor. The difference
between this method and `blitz.isFunction` is there are some objects which are
non-callable which are yet considered constructors (Element is one example).

####Example

```js
//true  
blitz.isConstructor(Element);  
//false  
blitz.isConstructor({});  
```

###`blitz.isFunction`

This method determines whether an object is a fuction.

####Example

```js
//false  
blitz.isFunction(undefined);  
//true  
blitz.isFunction(document.getElementById);  
```

###`blitz.overload`

See the [Function Overloading](#overload) section.