/**
@module jquery-dataview 数据视图

jquery插件，用于对DOM进行数据填充与更新，也很适合根据DOM模板创建对象。

特点：

- 允许人为精准控制更新区域，可以更新dataview对象或其任意子对象
- 对多层次数据支持良好，可对子对象数组用dv-for标签展开，并自动绑定到子对象数据。

## 为DOM对象填充数据

例：对一个DOM赋值

HTML:

```html
	<div class="customer">
		<p>id=<span name="id"></span></p>
		<p>name=<span name="name"></span></p>
	</div>
```

JS填充数据:

```javascript
	var customer = { id: 1001, name: "SAP AG" };
	$(".customer").dataview(customer);
```

递归遍历所有带name属性的结点，如`<span name="id"></span>`会用`customer.id`为其赋值。

JS修改数据后，可无参数调用dataview来刷新显示：

```javascript
	customer.name = "SAP China";
	$(".customer").dataview();
```

取DOM绑定的数据：

```javascript
	var data = $(".customer").dataview('getData');
```

上面是调用getData方法的形式，在文档中表示为

	@fn getData()

如果有参数，则加到调用名后面。

## 为模板填充数据

HTML:

```html
	<div id="divCustomers"></div>

	<style type="text/template" id="tplCustomer">
		<div class="customer">
			<p>id=<span name="id"></span></p>
			<p>name=<span name="name"></span></p>
		</div>
	</style>
```

JS:

```javascript
	var customers = [
		{ id: 1001, name: "SAP AG" },
		{ id: 2001, name: "Oracle CO" }
	];
	var jtplCustomer = $($("#tplCustomer").html());
	var jparent = $("#divCustomers");
	$.each(customers, function (i, customer) {
		jtplCustomer.clone()
			.dataview(customer)
			.appendTo(jparent);
	});
```

## 计算属性

在JS中通过`props`选项指定属性的计算函数。

HTML:

```html
	<div class="customer">
		<p>id=<span name="id"></span></p>
		<p>fullname=<span name="fullname"></span></p>
	</div>
```

JS: 定义fullname属性

```javascript
	var customer = { id: 1001, name: "SAP AG" };
	var opt = {
		props: {
			fullname: function () {
				// this表示当前层次数据
				return this.id + " - " + this.name;
			}
		}
	};
	$(".customer").dataview(customer, opt);

	// 更新：
	customer.name = "SAP China";
	$(".customer").dataview();
	// fullname也得到更新.
```

在初始化时，做为计算属性的函数会自动添加到相应的数据上。
在更新视图时，如果发现name属性指定的是一个函数，则以调用后的值来填充。

## 访问子对象

假如有数据：

```javascript
	var customer = {
		id: 1001, 
		name: "SAP AG",
		addr: {country: "CN", city: "Shanghai"}
	};
```

这里`addr`是`customer`的子对象，可以这样来显示`customer.addr.city`:

```html
	<span name="addr.city"></span>
```

求值时，以 `eval("data." + name)` 的方式获得值。（未使用with机制计算以免降低性能）

## 循环创建、条件创建、条件显示

子对象数组可以以`dv-for`属性来指定循环展开，每复制一个DOM，都会绑定数据到相应的子对象上。

dv-if及dv-show属性：根据该属性的值计算是否保留该结点，或显示该结点。

例：使用dv-for, dv-if, dv-show等标签：

HTML:

```html
	<div id="divCustomers">
		<div dv-for="customers" dv-if="id>=1000" class="customer">
			<li>
				<span dv-show="id<=2000">id=<span name="id"></span></span>
				name=<span name="name"></span>
			</li>
		</div>
	</div>
```

JS:

```javascript
	var data = {
		customers: [
			{ id: 1, name: "Olive CO" },
			{ id: 1001, name: "SAP AG" },
			{ id: 2001, name: "Oracle CO" }
		]
	};
	$("#divCustomers").dataview(data);
```

结果：

- dv-for指定了用于循环的数组数据，由data.customers数组总共生成两项，id=1的那项因不满足dv-if="id>1000"的条件没有创建。
- dv-show指定了显示出来的条件，因而id=2001的项未显示出id。

`dv-for`可以在顶层出现，这时dataview返回的是一个新的DOM数组，与传入的jo会不同。

```javascript
	jo1 = jo.dataview(data); // jo1与jo可能不同。
```

如果数据本身就是个数组，可以用`dv-for="this"`来标识数据：

```html
	<div dv-for="this" class="customer">
	</div>
```

JS:
```javascript
	var customers = [
		{ id: 1, name: "Olive CO" },
		{ id: 1001, name: "SAP AG" },
		{ id: 2001, name: "Oracle CO" }
	];
	$(".customer").dataview(customers);
```

dv-if及dv-show属性中指定一个条件表达式，它可以比name中指定的内容要复杂，它的计算原理是：

```javascript
	with(data) { eval(val); }
```

### 条件分支

除`dv-if`外，还可以使用`dv-elseif`, `dv-else`。

HTML:

```html
	<div dv-for="this" id="divStatus">
		<p dv-if="status=='YES'">已同意</p>
		<p dv-elseif="status=='NO'">已拒绝</p>
		<div dv-else>
			<input type="button" dv-on="btnYesNo_click" data-status="YES" value="同意">
			<input type="button" dv-on="btnYesNo_click" data-status="NO" value="拒绝">
		</div>
	</div>
```

JS:

```javascript
	var data = [
		{ status: 'YES' },
		{ status: 'NO' },
		{ status: 'NEW' },
	]
	$("#divStatus").dataview(data);
```

注意：

- 同一组标签必须用在同一层次的DOM上。下例中`dv-if`和`dv-else`不在同一层次上，最终结果是`dv-else`总会显示。

		<p dv-if="status=='YES'">已同意</p>
		<div><p dv-else>已拒绝</p></div>

- 在同一层上，`dv-if`可以多次出现。对每项均重新计算。支持嵌套，即`dv-if`等标签也可以多次出现在不同层次中。

## 指定事件

在HTML中使用`dv-on`属性指定事件，在JS中使用选项`events`与其对应。

```html
	<div dv-on="liOrder_click"></div>
```

上面代码定义了`jo.on("click", data, liOrder_click)`，所有用到的函数必须通过`events`选项定义：

```javascript
	var events = {
		liOrder_click: function (ev) {
			var order = ev.data; // 等同于 $(this).dataview('getData');
			// ...
		}
	};
	jo.dataview(data, {events: events});
```

可以指定多个事件，用逗号","隔开：

```html
	<input dv-on="txtName_change,txtName_keydown"></div>
```

HTML:

```html
	<form class="customer" dv-on="frmCustomer_submit">
		<p>id=<span name="id"></span></p>
		<input dv-on="txtName_change,txtName_keydown" name="name">
		<button dv-on="btnUpdate_click">更新</button>
	</form>
```

上面为form指定了submit事件，dv-on的值要求是`{domName}_{eventName}`的格式，domName可任意起名，eventName必须是合法的事件名。

JS:

```javascript
	var events = {
		frmCustomer_submit: function (ev) {
			alert(arguments.callee.name);
			console.log("cancel submit");
			return false;
		},
		txtName_change: function (ev) {
			alert(arguments.callee.name);
		},
		txtName_keydown: function (ev) {
			console.log(arguments.callee.name);
		},
		btnUpdate_click: function (ev) {
			alert(arguments.callee.name);
		}
	};
	var opt = {
		events: events
	};

	var customer = { id: 1001, name: "SAP AG" };
	$(".customer").dataview(customer, opt);
```

与直接使用onclick属性相比，用dv-on的好处有：

- 事件处理函数不必是全局函数。
- 事件处理函数的参数`ev.data`即是DOM绑定的数据，使用很方便。

## 获取数据

```javascript
	// 获取DOM关联的数据
	var data = jo.dataview('getData');

	//TODO:
	// 获取用户输入的数据
	var formData = jo.dataview('getFormData');
	// 获取用户输入的数据与原始数据差异部分。
	var formDataDiff = jo.dataview('getFormData', {diff: true});
```

## 多层嵌套的数据

每个对象数组是一个嵌套层次。

- 可通过数据的 `$parent` 属性访问上层数据。
- 支持子对象的计算字段
- 不必更新根对象，可以指定更新任意子对象的数据视图。

示例：数据模型如下：

	customer = {id, name, %addr={country, city}, @orders }
	@orders = {id, amount, @items={id, name} }

customer是0层，@orders是第1层，@items是第2层; 注意：addr下的字段与customer是当作同一层的。

JS数据：

```javascript
	var customer = {
		id: 1001, 
		name: "SAP AG",
		addr: {country: "CN", city: "Shanghai"},
		orders: [
			{id: 1, amount: 9000, items: [
				{id: 101, name: "item 101"},
				{id: 102, name: "item 102"}
			]},
			{id: 2, amount: 11000, items: [
				{id: 201, name: "item 201"}
			]}
		]
	}
```

HTML数据视图：

```html
	<div class="customer">
		<p> name: <span name="name"></span>  </p>
		<p> addr: <span name="addr.country"></span> / <span name="addr.city"></span> </p>
		<ul>
			<li dv-for="orders" class="order">
				<p>order id=<span name="id"></span>, amount=<span name="amount"></span></p>
				<ul>
					<li dv-for="items" class="item">
						<p>item id=<span name="id"></span></p>
						<p>item name=<span name="name"></span></p>
						<p>fullname=<span name="fullname"></span></p>
					</li>
				</ul>
			</li>
		</ul>
	</div>
```

注意：

- 可以使用`addr.country`的格式指定数据源。

JS:

```javascript
	var itemOpt = {
		props: {
			fullname: function () {
				var order = this.$parent;
				var customer = order.$parent;
				return customer.name + " - " + this.name;
			}
		}
	};
	var orderOpt = {
		children: {items: itemOpt}
	};
	var customerOpt = {
		children: {orders: orderOpt}
	};
	$(".customer").dataview(customer, customerOpt);

	// 局部更新：只更新一个item
	customer.orders[0].items[0].name += " - updated";
	$(".customer .order:first .item:first").dataview();

	// 只更新一个order:
	++ customer.orders[0].amount;
	customer.orders[0].items[0].name += " - updated2";
	$(".customer .order:first").dataview();

	// 全部更新
	$(".customer").dataview();
```

## 常见错误

生成的DOM有混乱：常常由标签未闭合导致

 */
function jquery_dataView($)
{

var m_version = '1.0';

// 以下函数首参数必须是dataview对象，用jo表示。
var m_exposed = {
	getData: getData,
	//setFormData: setFormData,

/**
@fn version()

取版本号:

	var ver = jo.dataview("version");

 */
	version: function (jo) {
		return m_version;
	}
};

var m_defaults = {
	props: {},
	events: {}
};

var m_ifstack = [];
var m_ifval = false;

/**
@fn getData(exact?=false)

取DOM元素对应的数据。
可对dataview对象或其任意子元素调用该函数，返回该元素所在层次对应的数据。

如果取到的是子数组中的数据，可以通过`$parent`属性取上层数据。

	var data = jo.dataview('getData');
	var parentData = data.$parent;

@param exact?=false 查找本结点上的数据，如果没有会继续查找父结点，直到遍历完父结点。设置为true禁止查找父结点。

 */
function getData(jo, exact)
{
	if (exact)
		return jo.data("dvData_");

	var dvData;
	while ( (dvData = jo.data("dvData_")) === undefined) {
		jo = jo.parent();
		if (jo.size() == 0)
			break;
	}
	return dvData;
}

function setData(jo, data)
{
	jo.data("dvData_", data);
}

/*
@opt = {props, events}
@param doInit true为首次调用，false为做更新视图操作
@param doSetData 仅在doInit=true时，对顶结点和dv-for结点调用时为true
 */
function setDataView(jo, data, opt, doInit, doSetData)
{
	if (jo.size() == 0)
		return jo;

	var vfor;
	if (doInit && (vfor = jo.attr("dv-for")) ) {
		var isThis = (vfor == 'this');
		var arrData = isThis? data: data[vfor];
		if (! $.isArray(arrData)) {
			console.log("!!! warn: not array: " + vfor);
			return $([]);
		}
		var opt1;
		if (! isThis) {
			opt1 = (opt.children && opt.children[vfor]) || {};
			opt1.events = opt.events;
		}
		else {
			opt1 = opt;
		}

		var joRet = $([]);
		$.each(arrData, function (i, data1) {
			var jo1 = jo.clone();
			jo1.removeAttr("dv-for"); // 不再展开
			if (! isThis)
				data1.$parent = data;
			jo1 = setDataView(jo1, data1, opt1, doInit, true);
			jo1.insertBefore(jo);
			joRet = joRet.add(jo1);
		});
		jo.remove();
		return joRet;
	}

	if (doInit && doSetData) {
		setData(jo, data);
		if (opt.props) {
			$.extend(data, opt.props);
		}
	}

	// 如果已设置关联数据，则使用它替代data
	if (!doInit && getData(jo, true) != null) {
		var dvData = getData(jo);
		if (dvData==null)
			$.error("*** dataview does not init");
		data = dvData;
	}

	var val, val1;
	if (doInit) {
		if (val = jo.attr("dv-if")) {
			val1 = !!evalWithin(data, val);
			m_ifval = val1;
			if (! m_ifval) {
				jo.remove();
				return $([]);
			}
			jo.removeAttr("dv-if");
		}
		else if (val = jo.attr("dv-elseif")) {
			if (m_ifval) {
				jo.remove();
				return $([]);
			}
			m_ifval = !!evalWithin(data, val);
			if (! m_ifval) {
				jo.remove();
				return $([]);
			}
			jo.removeAttr("dv-elseif");
		}
		else if ((val = jo.attr("dv-else")) != null) {
			if (m_ifval) {
				jo.remove();
				return $([]);
			}
			jo.removeAttr("dv-else");
		}
	}
	if (val = jo.attr("dv-show")) {
		val1 = !!evalWithin(data, val);
		jo.toggle(val1);
	}

	if (doInit && (val = jo.attr("dv-on"))) {
		// dv-on="item_click,item_change"
		$.each(val.split(/\s*,\s*/), function () {
			var fname = this.toString();
			var fn = opt.events[fname];
			if (fn == null) {
				$.error("*** no event handler: " + fname);
			}
			if (ms = fname.match(/_(\w+)/)) {
				jo.on(ms[1], data, fn);
			}
		});
	}

	if (jo.attr("name")) {
		setItemContentByName(jo, data);
	}

	if (doInit) {
		m_ifstack.push(m_ifval);
		m_ifval = false;
	}
	// !!! 不要用o.children遍历，否则删除结点后会导致遍历立即结束。
	$.each(jo.children(), function (i, child) {
		setDataView($(child), data, opt, doInit);
	});
	if (doInit) {
		m_ifval = m_ifstack.pop();
	}
	return jo;
}

// 参数名用的怪异，避免与data中字段名冲突
function evalWithin(data, code__080909)
{
	with (data) {
		return eval(code__080909);
	}
}

// 只支持"name", "addr.city"这种简单格式（第一个词必须是属性或子对象），比evalWithin高效。
function evalSimple(data, name)
{
	return eval('data.' + name);
}

function setItemContentByName(ji, data)
{
	var name = ji.attr("name");
	var content = null;
	if (name.indexOf('.') < 0) {
		content =  data[name];
	}
	else {
		content = evalSimple(data, name);
	}
	// 是计算属性
	if ($.isFunction(content)) {
		content = content.apply(data);
	}
	setItemContent(ji, content);
}

function setItemContent(ji, content)
{
	var isInput = ji.is(":input");
	if (content === undefined) {
		if (isInput) {
			if (ji[0].tagName === "TEXTAREA")
				content = ji.html();
			else
				content = ji.attr("value");
			if (content === undefined)
				content = "";
		}
		else {
			content = "";
		}
	}
	if (ji.is(":input")) {
		ji.val(content);
	}
	else {
		ji.html(content);
	}
}

/*
function getFormData(jo)
{
	var data = {};
	var orgData = jo.data("origin_") || {};
	jo.find("[name]:not([disabled])").each (function () {
		var ji = $(this);
		var name = ji.attr("name");
		var content;
		if (ji.is(":input"))
			content = ji.val();
		else
			content = ji.html();

		var orgContent = orgData[name];
		if (orgContent == null)
			orgContent = "";
		if (content == null)
			content = "";
		if (content !== String(orgContent)) // 避免 "" == 0 或 "" == false
			data[name] = content;
	});
	return data;
}

function setFormData(jo, data, opt)
{
	var opt1 = $.extend({
		setOrigin: false
	}, opt);
	if (data == null)
		data = {};
	var jo1 = jo.filter("[name]:not([noReset])");
	jo.find("[name]:not([noReset])").add(jo1).each (function () {
		var ji = $(this);
		setItemContentByName(ji);
	});
	jo.data("origin_", opt1.setOrigin? data: null);
}
*/

/**
@fn $.fn.dataview(data, opt?)
@fn $.fn.dataview(method, param1, ...)

@param opt={props, events}

由模板创建DOM，填充数据，绑定事件，数据更新后再调用可刷新DOM显示。支持多层次的数据。

返回处理后的结点集合。

注意：

- 只有顶层或dv-for标签（子对象数组）的DOM上会直接绑定数据。
- 初始化后，dv-for, dv-if属性会被删除。dv-show仍保留，可根据条件显示隐藏对象。
 */
$.fn.extend({
	dataview: function (data, opt) {
		if (typeof(data) == "string")
		{
			if (! m_exposed[data])
				$.error("*** unknown call: " + data);

			var args = [this];
			$.each(arguments, function (i, e) {
				if (i > 0)
					args.push(e);
			});
			return m_exposed[data].apply(this, args);
		}

		// 更新操作
		if (data == null || getData(this) != null)
			return setDataView(this);

		var opt1 = $.extend({}, m_defaults, opt);
		if (this.size() != 1) {
			$.error("*** dataview: MUST only one DOM object.");
		}
		// 初次：doSetData=true设置顶层数据。
		return setDataView(this, data, opt1, true, true);
	}
	
});

/**
@var $.fn.dataview.defaults
 */
$.fn.dataview.defaults = m_defaults;

}
jquery_dataView(window.jQuery);

