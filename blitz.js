/*jshint bitwise:true, strict:true, eqeqeq:false, eqnull:true, smarttabs:true, expr:true, immed:true, forin:true, noarg:true, nonew:true, laxbreak:true, undef:true, curly:true, latedef:true, loopfunc:true, newcap:true, browser:true, maxerr:50, quotmark:true, supernew:true, es5:true */
var blitz = (function (global, undef) {
	"use strict";
	
	function blitz (o) {
		var blitzReturn,
			blitzType = blitzHelper(o);
		if (blitzType && blitzType.intFn) {
			o = blitzType.intFn.apply(null, arguments);
			blitzType = blitzHelper(o);
		}
		if (blitzType === o) {
			return o;
		}
		//return a new blitzType object
		blitzReturn = create(blitzType.proto);
		defineProperty(blitzReturn, blitzKey, {
			value : -1
		});
		defineProperty(blitzReturn, "value", {
			value : o
		});
		return blitzReturn;
	}
	
	function blitzHelper (o) {
		return o == undef || o[blitzKey] == -1
			? o
			: blitzTypes[newBlitz(getPrototypeOf(o), o, 1)];
	}
	
	function Blitz () {}
	var iframe,
		nativeType = /(?:\s*function (\w+)\(\) \{\s+\[native code\]\s+\}\s*)|(?:\[object (\w+)\])/,
		blitzTypes = [],
		blitzKey = "blitz" + Date.now(),	
		//Prototypes
		objectProto = Object.prototype,
		//Object methods
		create = Object.create,
		defineProperty = Object.defineProperty,
		getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
		getOwnPropertyNames = Object.getOwnPropertyNames,
		isConstructor = blitz.isConstructor = function (o) {
			try {
				return 0 instanceof o || !!o.prototype;
			} catch (e) {
			}
			return false;
		},
		isFunction = blitz.isFunction =  function (o) {
			return typeof o == "function";
		},
		getPrototype = blitz.getPrototype = function (o) {
			return isConstructor(o)
					? o.prototype
					: getPrototypeOf(o);
		};

	if (global.document) {
		iframe = document.createElement("iframe");
		document.head.appendChild(iframe);
	}
	
	function getPrototypeOf(o) {
		return o == undef
			? undef
			: Object.getPrototypeOf(new Object(o));
	}
	
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
					if (type == undef) {
						if (type === undef) {
							containsUndefined = 1;
						}
						return type;
					}
					return blitzTypes[newBlitz(getPrototype(type), type)].proto;	
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
				var fn, j, k, every, match, arg, argTypes, typeGroup, type, fns, blitzType,
					args = [],
					i = 0,
					l = arguments.length;
				for (; i < l; i++) {
					blitzType = blitzHelper(arguments[i]);
					args.push(blitzType && blitzType.proto);
				}
				fn = fnMap[l];
				if (Array.isArray(fn)) {
					for (fns = fn, i = fn = 0; (argTypes = fns[i]); i++) {
						for (j = 0, every = 1; (typeGroup = argTypes[j]) && every; j++) {
							for (match = k = 0, l = typeGroup.length, arg = args[j]; k < l && !match; k++) {
								type = typeGroup[k];
								match = type == undef || arg == undef
									? type === arg
									: objectProto.isPrototypeOf.call(arg, type) || arg === type;
							}
							every = match;
						}
						if (every) {
							fn = argTypes.fn;
							break;
						}
					}
				}
				return (fn || fnMap["default"]).apply(this, arguments);	
			};
		}(fnMap));
	};

	blitz.extend = function (args) {
		var types = args.types || [args.type],
			props = args.props || {},
			ext = args.ext,
			keys = ext
				? getOwnPropertyNames(ext)
				: [];
		types.forEach(function (type) {
			var blitzProto = blitzTypes[newBlitz(getPrototype(type), type)].proto;
			keys.forEach(function (key) {
				var value = ext[key];
				defineProperty(blitzProto, key, {
					enumerable : false,
					configurable : true,
					value : isFunction(value)
						? function () {
							var ret = value.apply(this, arguments);
							return ret === undef
								? this
								: blitz(ret);
						  }
						: value
				});
			});
			Object.defineProperties(blitzProto, props);	
		});
	};
	
	blitz.intercept = function (args) {
		var types = args.types || [args.type];
		types.forEach(function (type) {
			blitzTypes[newBlitz(getPrototype(type), type)].intFn = args.fn;			
		});
	};
	
	function newBlitz (proto, type, forceInstance) {
		var blitzValue = getBlitzValue(proto);
		if (blitzValue === undef) {
			var i, iProto,
				isObj = !getPrototypeOf(proto),
				id = (forceInstance || !isConstructor(type)
					? objectProto.toString.call(type)
					: Function.prototype.toString.call(type)).replace(nativeType, "$1$2");
			if (id && iframe && !blitzTypes[id]) {
				iProto = iframe.contentWindow[id];
				if (isConstructor(iProto)) {
					iProto = iProto.prototype;
					blitzValue = newBlitzHelper(iProto);
					//add synonym
					blitzTypes[id] = blitzTypes[blitzValue];
				}
			}
			if (id && (id != "Object" || isObj) && blitzTypes[id]) {
				i = blitzValue = blitzTypes[id].proto.__i__;
				while (proto && getBlitzValue(proto) === undef) {
					setBlitzValue(proto, i);
					proto = getPrototypeOf(proto);
					i = getPrototypeOf(blitzTypes[i].proto).__i__;
				}
			} else if (isObj) {
				blitzValue = 0;
				setBlitzValue(proto, blitzValue);
			} else {
				blitzValue = newBlitzHelper(proto);
				if (id && !blitzTypes[id]) {
					//add synonym
					blitzTypes[id] = blitzTypes[blitzValue];
				}
			}
		}
		return blitzValue;
	}
		
	function getBlitzValue (proto) {
		var desc = getOwnPropertyDescriptor(proto, "constructor"),
			get = desc && desc.get;
		if (get && objectProto.hasOwnProperty.call(get, blitzKey)) {
			return get[blitzKey];
		}
	}
	
	function setBlitzValue (proto, i) {
		var con = proto.constructor,
			propDesc = getOwnPropertyDescriptor(proto, "constructor"),
			hasGet = propDesc && objectProto.hasOwnProperty.call(propDesc, "get"),
			get = hasGet && propDesc.get
				? propDesc.get
				:function () {
					return con;
				},
			set = hasGet
				? propDesc.set
				: function (newCon) {
					con = newCon;
				};
		if (!propDesc || propDesc.configurable) {
			defineProperty(proto, "constructor", {
				get : get,
				set : set
			});
		}
		get[blitzKey] = i;
	}

	//Takes a prototype and creates a new Blitz for every non-registered
	//prototype in the prototype chain
	function newBlitzHelper (proto) {
		var blitzValue = getBlitzValue(proto);
		if (blitzValue === undef) {
			var blitzType,
				protoproto = getPrototypeOf(proto),
				propNames = getOwnPropertyNames(proto);
			//register the entire prototype chain
			blitzType = protoproto
				? create(blitzTypes[newBlitzHelper(protoproto)].proto)
				: new Blitz;
			//provide access to the object's properties on the Blitz
			propNames.forEach(function (propName) {
				defineProperty(blitzType, propName, {
					configurable : true,
					value : function () {
						var target = this.value,
							prop = target[propName];
						if (isFunction(prop)) {
							var ret = prop.apply(target, arguments);
							return ret === undef
								? this
								: blitz(ret);							
						} else if (arguments.length){
							try {
								target[propName] = arguments[0];
							} catch (e) {
								throw new TypeError(propName + " is read-only");
							}
							return this;	
						}
						return blitz(prop);	
					}
				});
			});
			//add the new Blitz to the blitzTypes and
			//record the blitzType index on the prototype
			blitzValue = blitzTypes.push({proto : blitzType}) - 1;
			setBlitzValue(proto, blitzValue);
			defineProperty(blitzType, "__i__", {
				value : blitzValue
			});
		}
		return blitzValue;
	}
	
	newBlitz(Object.prototype, {}, 1);
	
	return blitz;
})(this);