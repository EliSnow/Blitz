/*jshint bitwise:true, strict:true, eqeqeq:false, eqnull:true, smarttabs:true, expr:true, immed:true, forin:true, noarg:true, nonew:true, laxbreak:true, undef:true, curly:true, latedef:true, loopfunc:true, newcap:true, browser:true, maxerr:50, quotmark:true, supernew:true, es5:true */
var blitz = (function (global) {
	"use strict";
	
	function blitz (o) {
		var blitzType = blitzHelper(o);
		if (blitzType && blitzType.intFn) {
			o = blitzType.intFn.apply(null, arguments);
			blitzType = blitzHelper(o);
		}
		if (blitzType === o) {
			return o;
		}
		//return a new blitzType object
		return create(blitzType.proto, {
			value : {
				value : o
			},
			__blitzType__ : {
				value : -1
			}
		});
	}
	
	function blitzHelper (o) {
		if (o == void 0 || o.__blitzType__ == -1) {
			return o;
		}
		newBlitz(getPrototypeOf(o));
		return blitzTypes[o.__blitzType__];	
	}
	
	function Blitz () {}
	
	var blitzTypes = [],
		//Prototypes
		objectProto = Object.prototype,
		//Object methods
		create = Object.create,
		defineProperty = Object.defineProperty,
		getOwnPropertyNames = Object.getOwnPropertyNames,
		isConstructor = blitz.isConstructor = function (o) {
			//We cannot simply check if `o` is a function because some
			//constructors like `Element` are not callable functions
			//Firefox reports NodeList and HTMLCollection instances as valid
			//`instanceof` constructors and Chrome and IE report isNaN, so we must
			//also check for the prototye property
			try {
				return 0 instanceof o || !!o.prototype;
			} catch (e) {
			}
			return false;
		},
		isFunction = blitz.isFunction =  function (o) {
			return typeof o == "function";
		},
		//Gets the prototype of an object. The difference between this method
		//and `Object.getPrototypeOf` is when a constructor is provided it will
		//return the prototype for the constructor type rather than the
		//constructor's actual prototype, also works with primitives
		getPrototype = blitz.getPrototype = function (o) {
			return isConstructor(o)
					? o.prototype
					: getPrototypeOf(o);
		};
	
	function getPrototypeOf(o) {
		return o == void 0
			? undefined
			: Object.getPrototypeOf(new Object(o));
	}

	//Creates an overloaded function which redirects to another function based
	//upon the number or types of arguments. It takes an object in the following
	//format:
	//	{
	//		4 : function () {
	//			//function called when 4 arguments are provided
	//		},
	//		types1 : [HTMLBodyElement, String],
	//		fn1 : function () {
	//			//function called when an HTMLBodyElement and String are passed
	//			//in as argumnts
	//		},
	//		type2 : Array,
	//		fn2 : function () {
	//			//function called when an array is passed in as an argument
	//		},
	//		"default" : function () {
	//			//function to be called as a default if none of the others match
	//		}
	//	}
	//For functions to be called based on the number of arguments the property
	//is an integer with the value being the function to call. Functions to be
	//called based on the type of the arguments require two properties, one for
	//the argument types and one for the function. The argument types can be a
	//single value or an array of values. The values can be either constructors
	//or object instances. The names of the properties for type bound functions
	//must be "type[s]1", "type[s]2", ... , "type[s]N" with the associated functions
	//"fn1", "fn2", ... , "FnN". A default function can also be
	//provided as a fall back. Remember to surround "default" in quotes as it is
	//a reserved keyword and may cause problems if not quoted.
	blitz.overload = function (args) {
		var argTypes, typesMap, fn, l, propNames, containsUndefined, undefinedCount,
			i = 1,
			fnMap = {};
		while ((argTypes = args["types" + i] || [args["type" + i]]) && (fn = args["fn" + i++])) {
			l = argTypes.length;
			typesMap = [];
			argTypes.forEach(function (type) {
				containsUndefined = undefinedCount = 0;
				type = (Array.isArray(type) ? type : [type]).map(function (type) {
					if (type == void 0) {
						if (type === undefined) {
							containsUndefined = 1;
						}
						return type;
					}
					var proto = getPrototype(type);
					newBlitz(proto);
					return blitzTypes[proto.__blitzType__].proto;	
				});
				if (containsUndefined) {
					undefinedCount++;
				} else {
					undefinedCount = 0;
				}
				typesMap.push(type);
			});
			for (; undefinedCount-- >= 0; typesMap = typesMap.slice(0, --l)) { 
				typesMap.fn = fn;
				(fnMap[l] || (fnMap[l] = [])).push(typesMap);
			}
		}
		propNames = getOwnPropertyNames(args);
		for (i = 0, l = propNames.length; i < l; i++) {
			fnMap[propNames[i]] = args[propNames[i]];
		}
		return (function (fnMap) {
			return function () {
				var fn, j, k, every, match, arg, argTypes, typeGroup, type,
					args = [],
					fns = fn,
					i = 0,
					l = arguments.length;
				for (; i < l; i++) {
					args.push(blitz(arguments[i]));
				}
				fn = fnMap[l];
				if (Array.isArray(fn)) {
					for (fns = fn, i = fn = 0; (argTypes = fns[i]) && !fn; i++) {
						for (j = 0, every = 1; (typeGroup = argTypes[j]) && every; j++) {
							for (match = k = 0, l = typeGroup.length, arg = args[j]; k < l && !match; k++) {
								type = typeGroup[k];
								match = type == void 0
									? type === arg
									: objectProto.isPrototypeOf.call(type, arg);
							}
							every = match;
						}
						if (every) {
							fn = argTypes.fn;
						}
					}
				}
				return (fn || fnMap["default"]).apply(this, arguments);	
			};
		}(fnMap));
	};
	
	//Adds methods to a Blitz's prototype. Takes an object in the form:
	//	{
	//		types : object_instance_or_constructor,
	//		ext : {
	//			methodName1 : function () {
	//				//do stuff
	//			},
	//			methodName2 : function () {
	//				//do stuff
	//			},
	//			property : "value"
	//		},
	//		props : {
	//			property : {
	//				get : function () {
	//					//return some value
	//				},
	//				set : function (newValue) {
	//					//set some value
	//				}
	//			}
	//		}
	//	}
	//Properties within `ext` are added directly to the prototype, whereas the
	//`props` object will be added to the prototype using
	//`Object.defineProperties`
	blitz.extend = function (args) {
		var types = args.types || [args.type],
			props = args.props || {},
			ext = args.ext,
			keys = ext
				? getOwnPropertyNames(ext)
				: [];
		types.forEach(function (type) {
			var blitzProto,
				proto = getPrototype(type);
			newBlitz(proto);
			blitzProto = blitzTypes[proto.__blitzType__].proto;
			keys.forEach(function (key) {
				var value = ext[key];
				defineProperty(blitzProto, key, {
					enumerable : false,
					configurable : true,
					value : isFunction(value)
						? function () {
							var ret = value.apply(this, arguments);
							return ret === undefined
								? this
								: blitz(ret);
						  }
						: value
				});
			});
			Object.defineProperties(blitzProto, props);	
		});
	};
	
	//Adds a transformer to the given type(s). A transformer will, when `blitz`
	//is called with a particular type of object, change the passed in object
	//into another type of object. This can be useful, for example, in
	//automatically transforming array like objects into arrays. The format for
	//the paramter object is as follows:
	//	{
	//		types : [types_here],
	//		transformer : function (o) {
	//			//return a new object type
	//		}
	//	}
	blitz.intercept = function (args) {
		var types = args.types || [args.type];
		types.forEach(function (type) {
			var proto = getPrototype(type);
			newBlitz(proto);
			blitzTypes[proto.__blitzType__].intFn = args.fn;			
		});
	};
	
	//Checks if a prototype has its own `__blitzType__` property
	function hasNoBlitz (proto) {
		return !objectProto.hasOwnProperty.call(proto, "__blitzType__");
	}
	
	//Allows cross-global-context recognition of types. Takes a function which
	//will be passed a global object. Using that global object the function
	//should return an instance or constructor. For example, so the `Array` type
	//can be recognized across global contexts we may use the following
	//function:
	//	function (global) {
	//		return global.Array;
	//	}
	blitz.registerType = function (fn) {
		var proto,
			o = fn(global);
		if (o != void 0) {
			proto = getPrototype(o);
			newBlitzHelper(proto);
			//associate the fn with the blitzType
			blitzTypes[proto.__blitzType__].fn = fn;
		} else {
			blitzTypes.push({ fn: fn });
		}
	};
	
	//Takes a prototype and registers a new Blitz. If the prototype is from
	//another global context it will check if that prototype maps to a
	//preexisting Blitz
	function newBlitz (proto) {
		var fnConstructor, globalContext;
		//test if proto is a constructor
		if (hasNoBlitz(proto)) {
			//get the global Function
			fnConstructor = proto.constructor;
			while (fnConstructor != fnConstructor.constructor) {
				fnConstructor = fnConstructor.constructor;
			}
			//is the new type from another global context?
			if (fnConstructor != Function) {
				globalContext = fnConstructor("return self")();
				//run all of the registered fn types for the global context
				blitzTypes.forEach(function (blitzType, i) {
					if (blitzType.fn) {
						var p = blitzType.fn(globalContext);
						if (p) {
							p = getPrototype(p);
							if (blitzType.proto) {
								defineProperty(p, "__blitzType__", {
									value : i
								});
							} else {
								//a registered type which does not yet have a proto
								newBlitzHelper(p, i);
							}
						}
					}					
				});
			}
			//register the type
			newBlitzHelper(proto);
		}
	}
	
	//Takes a prototype and creates a new Blitz for every non-registered
	//prototype in the prototype chain
	function newBlitzHelper (proto, existingBlitzIndex) {
		if (hasNoBlitz(proto)) {
			var blitzType, i,
				protoproto = getPrototypeOf(proto),
				propNames = getOwnPropertyNames(proto);
			//register the entire prototype chain
			if (protoproto) {
				newBlitzHelper(protoproto);
				blitzType = create(blitzTypes[protoproto.__blitzType__].proto);
			} else {
				blitzType = new Blitz;
			}
			//provide access to the object's properties on the Blitz
			propNames.forEach(function (propName) {
				defineProperty(blitzType, propName, {
					configurable : true,
					value : function () {
						var target = this.value,
							prop = target[propName];
						if (isFunction(prop)) {
								var ret = prop.apply(target, arguments);
								return ret === undefined
									? this
									: blitz(ret);							
						} else {
							if (arguments.length) {
								try {
									target[propName] = arguments[0];
								} catch (e) {
									throw new TypeError(propName + " is read-only");
								}
								return this;
							}
							return blitz(prop);						
						}
					}
				});
			});
			//add the new Blitz to the blitzTypes and
			//record the blitzType index on the prototype
			if (existingBlitzIndex != void 0) {
				i = existingBlitzIndex;
				blitzTypes[i].proto = blitzType;
			} else {
				i = blitzTypes.push({proto : blitzType}) - 1;
			}
			defineProperty(proto, "__blitzType__", {
				value : i
			});
		}
	}
	
	return blitz;
})(this);