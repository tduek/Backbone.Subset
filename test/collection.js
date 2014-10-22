(function() {
  var a, b, c, d, e, col, otherCol, sub, otherSub;

  module("Backbone.Collection", {

    setup: function() {
      a         = new Backbone.Model({id: 3, label: 'a'});
      b         = new Backbone.Model({id: 2, label: 'b'});
      c         = new Backbone.Model({id: 1, label: 'c'});
      d         = new Backbone.Model({id: 0, label: 'd'});
      e         = null;
      col       = new Backbone.Collection();
      otherCol  = new Backbone.Collection();
      sub       = new Backbone.Subset([a,b,c,d], {parentCollection: col});
      otherSub  = new Backbone.Subset([], {parentCollection: otherCol});
    }

  });

  test("new and sort", 9, function() {
    var counter = 0;
    sub.on('sort', function(){ counter++; });
    equal(sub.first(), a, "a should be first");
    equal(sub.last(), d, "d should be last");
    sub.comparator = function(a, b) {
      return a.id > b.id ? -1 : 1;
    };
    sub.sort();
    equal(counter, 1);
    equal(sub.first(), a, "a should be first");
    equal(sub.last(), d, "d should be last");
    sub.comparator = function(model) { return model.id; };
    sub.sort();
    equal(counter, 2);
    equal(sub.first(), d, "d should be first");
    equal(sub.last(), a, "a should be last");
    equal(sub.length, 4);
  });

  test("String comparator.", 1, function() {
    var collection = new Backbone.Collection()
    var subset = new Backbone.Subset([
      {id: 3},
      {id: 1},
      {id: 2}
    ], {
      comparator: 'id',
      parentCollection: collection
    });

    deepEqual(subset.pluck('id'), [1, 2, 3]);
  });

  test("new and parse", 3, function() {
    var Subset = Backbone.Subset.extend({
      parse : function(data) {
        return _.filter(data, function(datum) {
          return datum.a % 2 === 0;
        });
      }
    });
    var collection = new Backbone.Collection();
    var models = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
    var subset = new Subset(models, {
      parse: true,
      parentCollection: collection
    });
    strictEqual(subset.length, 2);
    strictEqual(subset.first().get('a'), 2);
    strictEqual(subset.last().get('a'), 4);
  });

  test("clone preserves model, comparator, and parentCollection", 4, function() {
    var Model = Backbone.Model.extend();
    var comparator = function(model){ return model.id; };

    var collection = new Backbone.Collection([], {model: Model});
    var subset = new Backbone.Subset([{id: 1}], {
      comparator: comparator,
      parentCollection: collection
    }).clone();
    subset.add({id: 2});
    ok(subset.at(0) instanceof Model);
    ok(subset.at(1) instanceof Model);
    strictEqual(subset.comparator, comparator);
    strictEqual(subset.parentCollection, collection);
  });

  test("get", 6, function() {
    equal(sub.get(0), d);
    equal(sub.get(d.clone()), d);
    equal(sub.get(2), b);
    equal(sub.get({id: 1}), c);
    equal(sub.get(c.clone()), c);
    equal(sub.get(sub.first().cid), sub.first());
  });

  test("get with non-default ids", 5, function() {
    var MongoModel = Backbone.Model.extend({idAttribute: '_id'});
    var model = new MongoModel({_id: 100});
    var col = new Backbone.Collection([], {model: MongoModel});
    var sub = new Backbone.Subset([model], {parentCollection: col});

    equal(sub.get(100), model);
    equal(sub.get(model.cid), model);
    equal(sub.get(model), model);
    equal(sub.get(101), void 0);

    var sub2 = new Backbone.Subset([], {parentCollection: col});
    sub2.model = MongoModel;
    sub2.add(model.attributes);
    equal(sub2.get(model.clone()), sub2.first());
  });

  test('get with "undefined" id', function() {
    var collection = new Backbone.Collection();
    var subset = new Backbone.Subset(
      [{id: 1}, {id: 'undefined'}],
      {parentCollection: collection}
    );
    equal(subset.get(1).id, 1);
  });

  test("update index when id changes", 4, function() {
    var col = new Backbone.Collection();
    var sub = new Backbone.Subset([], {
      parentCollection: col
    });
    sub.add([
      {id : 0, name : 'one'},
      {id : 1, name : 'two'}
    ]);
    var one = sub.get(0);
    equal(one.get('name'), 'one');
    sub.on('change:name', function (model) { ok(this.get(model)); });
    one.set({name: 'dalmatians', id : 101});
    equal(sub.get(0), null);
    equal(sub.get(101).get('name'), 'dalmatians');
  });

  test("at", 1, function() {
    equal(sub.at(2), c);
  });

  test("pluck", 1, function() {
    equal(sub.pluck('label').join(' '), 'a b c d');
  });

  test("add", 14, function() {
    var added, opts, secondAdded;
    added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label : 'e'});
    otherSub.add(e);
    otherSub.on('add', function() {
      secondAdded = true;
    });
    sub.on('add', function(model, collection, options){
      added = model.get('label');
      opts = options;
    });
    sub.add(e, {amazing: true});
    equal(added, 'e');
    equal(sub.length, 5);
    equal(sub.last(), e);
    equal(otherSub.length, 1);
    equal(secondAdded, null);
    ok(opts.amazing);

    var f = new Backbone.Model({id: 20, label : 'f'});
    var g = new Backbone.Model({id: 21, label : 'g'});
    var h = new Backbone.Model({id: 22, label : 'h'});
    var atCol = new Backbone.Collection();
    var atSub = new Backbone.Subset([f, g, h], {
      parentCollection: atCol
    });
    equal(atSub.length, 3);
    atSub.add(e, {at: 1});
    equal(atSub.length, 4);
    equal(atSub.at(1), e);
    equal(atSub.last(), h);

    var coll = new Backbone.Collection();
    var subs = new Backbone.Subset(new Array(2), {
      parentCollection: coll
    });
    var addCount = 0;
    subs.on('add', function(){
        addCount += 1;
    });
    subs.add([undefined, f, g]);
    equal(subs.length, 5);
    equal(addCount, 3);
    subs.add(new Array(4));
    equal(subs.length, 9);
    equal(addCount, 7);
  });

  test("add multiple models", 6, function() {
    var col = new Backbone.Collection([{at: 0}, {at: 1}, {at: 9}]);
    col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
    for (var i = 0; i <= 5; i++) {
      equal(col.at(i).get('at'), i);
    }
  });

  test("add; at should have preference over comparator", 1, function() {
    var Sub = Backbone.Subset.extend({
      comparator: function(a,b) {
        return a.id > b.id ? -1 : 1;
      }
    });

    var col = new Backbone.Collection();
    var sub = new Sub([{id: 2}, {id: 3}], {
      parentCollection: col
    });
    sub.add(new Backbone.Model({id: 1}), {at: 1});

    equal(sub.pluck('id').join(' '), '3 1 2');
  });

  test("can't add model to collection twice", function() {
    var col = new Backbone.Collection();
    var sub = new Backbone.Subset([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}], {
      parentCollection: col
    });
    equal(sub.pluck('id').join(' '), '1 2 3');
  });

  test("can't add different model with same id to collection twice", 1, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {
      parentCollection: col
    });
    sub.unshift({id: 101});
    sub.add({id: 101});
    equal(sub.length, 1);
  });

  test("merge in duplicate models with {merge: true}", 3, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {parentCollection: col});
    sub.add([{id: 1, name: 'Moe'}, {id: 2, name: 'Curly'}, {id: 3, name: 'Larry'}]);
    sub.add({id: 1, name: 'Moses'});
    equal(sub.first().get('name'), 'Moe');
    sub.add({id: 1, name: 'Moses'}, {merge: true});
    equal(sub.first().get('name'), 'Moses');
    sub.add({id: 1, name: 'Tim'}, {merge: true, silent: true});
    equal(sub.first().get('name'), 'Tim');
  });

  test("add model to multiple collections", 14, function() {
    var counter = 0;
    var e = new Backbone.Model({id: 10, label : 'e'});
    e.on('add', function(model, collection) {
      counter++;
      equal(e, model);
      var collOrSub;
      if (counter > 2) {
        collOrSub = (collection === colF) ? colF : subF;
        equal(collection, collOrSub);
      } else {
        collOrSub = (collection === colE) ? colE : subE;
        equal(collection, collOrSub);
      }
    });
    var colE = new Backbone.Collection([]);
    var subE = new Backbone.Subset([], {parentCollection: colE});
    subE.on('add', function(model, collection) {
      equal(e, model);
      equal(subE, collection);
    });
    var colF = new Backbone.Collection([]);
    var subF = new Backbone.Subset([], {parentCollection: colF});
    subF.on('add', function(model, collection) {
      equal(e, model);
      equal(subF, collection);
    });
    subE.add(e);
    equal(e.collection, subE);
    subF.add(e);
    equal(e.collection, subE);
  });

  test("add model with parse", 1, function() {
    var Model = Backbone.Model.extend({
      parse: function(obj) {
        obj.value += 1;
        return obj;
      }
    });

    var Col = Backbone.Collection.extend({model: Model});
    var Sub = Backbone.Subset.extend({});
    var col = new Col;
    var sub = new Sub([], {parentCollection: col});
    sub.add({value: 1}, {parse: true});
    equal(col.at(0).get('value'), 2);
  });

  test("add with parse and merge", function() {
    var collection = new Backbone.Collection();
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.parse = function(attrs) {
      return _.map(attrs, function(model) {
        if (model.model) return model.model;
        return model;
      });
    };
    subset.add({id: 1});
    subset.add({model: {id: 1, name: 'Alf'}}, {parse: true, merge: true});
    equal(subset.first().get('name'), 'Alf');
  });

  test("add model to collection with sort()-style comparator", 3, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {parentCollection: col});
    sub.comparator = function(a, b) {
      return a.get('name') < b.get('name') ? -1 : 1;
    };
    var tom = new Backbone.Model({name: 'Tom'});
    var rob = new Backbone.Model({name: 'Rob'});
    var tim = new Backbone.Model({name: 'Tim'});
    sub.add(tom);
    sub.add(rob);
    sub.add(tim);
    equal(sub.indexOf(rob), 0);
    equal(sub.indexOf(tim), 1);
    equal(sub.indexOf(tom), 2);
  });

  test("comparator that depends on `this`", 2, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {parentCollection: col})
    sub.negative = function(num) {
      return -num;
    };
    sub.comparator = function(a) {
      return this.negative(a.id);
    };
    sub.add([{id: 1}, {id: 2}, {id: 3}]);
    deepEqual(sub.pluck('id'), [3, 2, 1]);
    sub.comparator = function(a, b) {
      return this.negative(b.id) - this.negative(a.id);
    };
    sub.sort();
    deepEqual(sub.pluck('id'), [1, 2, 3]);
  });

  test("remove", 5, function() {
    var removed = null;
    var otherRemoved = null;
    sub.on('remove', function(model, col, options) {
      removed = model.get('label');
      equal(options.index, 3);
    });
    otherSub.on('remove', function(model, col, options) {
      otherRemoved = true;
    });
    sub.remove(d);
    equal(removed, 'd');
    equal(sub.length, 3);
    equal(sub.first(), a);
    equal(otherRemoved, null);
  });

  test("add and remove return values", 13, function() {
    var Even = Backbone.Model.extend({
      validate: function(attrs) {
        if (attrs.id % 2 !== 0) return "odd";
      }
    });
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {parentCollection: col});
    sub.model = Even;

    var list = sub.add([{id: 2}, {id: 4}], {validate: true});
    equal(list.length, 2);
    ok(list[0] instanceof Backbone.Model);
    equal(list[1], sub.last());
    equal(list[1].get('id'), 4);

    list = sub.add([{id: 3}, {id: 6}], {validate: true});
    equal(sub.length, 3);
    equal(list[0], false);
    equal(list[1].get('id'), 6);

    var result = sub.add({id: 6});
    equal(result.cid, list[1].cid);

    result = sub.remove({id: 6});
    equal(sub.length, 2);
    equal(result.id, 6);

    list = sub.remove([{id: 2}, {id: 8}]);
    equal(sub.length, 1);
    equal(list[0].get('id'), 2);
    equal(list[1], null);
  });

  test("shift and pop", 2, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([{a: 'a'}, {b: 'b'}, {c: 'c'}], {
      parentCollection: col
    });

    equal(sub.shift().get('a'), 'a');
    equal(sub.pop().get('c'), 'c');
  });

  test("slice", 2, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([{a: 'a'}, {b: 'b'}, {c: 'c'}], {
      parentCollection: col
    });
    var array = sub.slice(1, 3);
    equal(array.length, 2);
    equal(array[0].get('b'), 'b');
  });

  test("events are unbound on remove", 3, function() {
    var counter = 0;
    var dj = new Backbone.Model();
    var emcees = new Backbone.Collection();
    var emceesSub = new Backbone.Subset([dj], {
      parentCollection: emcees
    });
    emceesSub.on('change', function(){ counter++; });
    dj.set({name : 'Kool'});
    equal(counter, 1);
    emceesSub.reset([]);
    equal(dj.collection, undefined);
    dj.set({name : 'Shadow'});
    equal(counter, 1);
  });

  test("remove in multiple collections", 7, function() {
    var modelData = {
      id : 5,
      title : 'Othello'
    };
    var passed = false;
    var e = new Backbone.Model(modelData);
    var f = new Backbone.Model(modelData);
    f.on('remove', function() {
      passed = true;
    });
    var colE = new Backbone.Collection();
    var subE = new Backbone.Subset([e], {parentCollection: colE});
    var colF = new Backbone.Collection();
    var subF = new Backbone.Subset([f], {parentCollection: colF});
    ok(e != f);
    ok(colE.length === 1);
    ok(colF.length === 1);
    subE.remove(e);
    equal(passed, false);
    ok(subE.length === 0);
    subF.remove(e);
    ok(subF.length === 0);
    equal(passed, true);
  });

  test("remove same model in multiple collection", 16, function() {
    var counter = 0;
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.on('remove', function(model, collection) {
      counter++;
      equal(e, model);
      var colOrSub;
      if (counter > 1) {
        colOrSub = (collection == subE ? subE : colE)
        equal(collection, colOrSub);
      } else {
        colOrSub = (collection == subF ? subF : colF)
        equal(collection, colOrSub);
      }
    });
    var colE = new Backbone.Collection();
    var subE = new Backbone.Subset([e], {parentCollection: colE});
    subE.on('remove', function(model, collection) {
      equal(e, model);
      equal(subE, collection);
    });
    var colF = new Backbone.Collection();
    var subF = new Backbone.Subset([e], {parentCollection: colF});
    subF.on('remove', function(model, collection) {
      equal(e, model);
      equal(subF, collection);
    });
    equal(subE, e.collection);
    subF.remove(e);
    ok(subF.length === 0);
    ok(subE.length === 1);
    equal(counter, 1);
    equal(subE, e.collection);
    subE.remove(e);
    equal(null, e.collection);
    ok(subE.length === 0);
    equal(counter, 2);
  });

  test("model destroy removes from all collections", 3, function() {
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.sync = function(method, model, options) { options.success(); };
    var colE = new Backbone.Collection();
    var subE = new Backbone.Subset([e], {parentCollection: colE});
    var colF = new Backbone.Collection();
    var subF = new Backbone.Subset([e], {parentCollection: colF});
    e.destroy();
    ok(colE.length === 0);
    ok(colF.length === 0);
    equal(undefined, e.collection);
  });

  test("Collection: non-persisted model destroy removes from all collections", 3, function() {
    var e = new Backbone.Model({title: 'Othello'});
    e.sync = function(method, model, options) { throw "should not be called"; };
    var colE = new Backbone.Collection;
    var subE = new Backbone.Subset([e], {parentCollection: colE});
    var colF = new Backbone.Collection;
    var subF = new Backbone.Subset([e], {parentCollection: colF});
    e.destroy();
    ok(subE.length === 0);
    ok(subF.length === 0);
    equal(undefined, e.collection);
  });

  test("fetch", 4, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.url = '/test';
    subset.fetch();
    equal(this.syncArgs.method, 'read');
    equal(this.syncArgs.model, subset);
    equal(this.syncArgs.options.parse, true);

    subset.fetch({parse: false});
    equal(this.syncArgs.options.parse, false);
  });

  test("fetch with an error response triggers an error event", 1, function () {
    var collection = new Backbone.Collection();
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.on('error', function () {
      ok(true);
    });
    subset.sync = function (method, model, options) { options.error(); };
    subset.fetch();
  });

  test("ensure fetch only parses once", 1, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    var counter = 0;
    subset.parse = function(models) {
      counter++;
      return models;
    };
    subset.url = '/test';
    subset.fetch();
    this.syncArgs.options.success();
    equal(counter, 1);
  });

  test("create", 4, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.url = '/test';
    var model = subset.create({label: 'f'}, {wait: true});
    equal(this.syncArgs.method, 'create');
    equal(this.syncArgs.model, model);
    equal(model.get('label'), 'f');
    equal(model.collection, subset);
  });

  test("create with validate:true enforces validation", 3, function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingSubset = Backbone.Subset.extend({
      model: ValidatingModel
    });
    var col = new Backbone.Collection;
    var sub = new ValidatingSubset([], {parentCollection: col});
    sub.on('invalid', function (collection, error, options) {
      equal(error, "fail");
      equal(options.validationError, 'fail');
    });
    equal(sub.create({"foo":"bar"}, {validate:true}), false);
  });

  test("a failing create returns model with errors", function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingSubset = Backbone.Subset.extend({
      model: ValidatingModel
    });
    var col = new Backbone.Collection;
    var sub = new ValidatingSubset([], {parentCollection: col});
    var m = sub.create({"foo":"bar"});
    equal(m.validationError, 'fail');
    equal(sub.length, 1);
  });

  test("initialize", 1, function() {
    var Subset = Backbone.Subset.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var col = new Backbone.Collection;
    var sub = new Subset([], {parentCollection: col});
    equal(sub.one, 1);
  });

  test("toJSON", 1, function() {
    equal(JSON.stringify(sub), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
  });

  test("where and findWhere", 8, function() {
    var model = new Backbone.Model({a: 1});
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([
      model,
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ], {parentCollection: col});
    equal(sub.where({a: 1}).length, 3);
    equal(sub.where({a: 2}).length, 1);
    equal(sub.where({a: 3}).length, 1);
    equal(sub.where({b: 1}).length, 0);
    equal(sub.where({b: 2}).length, 2);
    equal(sub.where({a: 1, b: 2}).length, 1);
    equal(sub.findWhere({a: 1}), model);
    equal(sub.findWhere({a: 4}), void 0);
  });

  test("Underscore methods", 16, function() {
    equal(sub.map(function(model){ return model.get('label'); }).join(' '), 'a b c d');
    equal(sub.any(function(model){ return model.id === 100; }), false);
    equal(sub.any(function(model){ return model.id === 0; }), true);
    equal(sub.indexOf(b), 1);
    equal(sub.size(), 4);
    equal(sub.rest().length, 3);
    ok(!_.include(sub.rest(), a));
    ok(_.include(sub.rest(), d));
    ok(!sub.isEmpty());
    ok(!_.include(sub.without(d), d));
    equal(sub.max(function(model){ return model.id; }).id, 3);
    equal(sub.min(function(model){ return model.id; }).id, 0);
    deepEqual(sub.chain()
            .filter(function(o){ return o.id % 2 === 0; })
            .map(function(o){ return o.id * 2; })
            .value(),
         [4, 0]);
    deepEqual(sub.difference([c, d]), [a, b]);
    ok(sub.include(col.sample()));
    var first = sub.first();
    ok(sub.indexBy('id')[first.id] === first);
  });

  test("reset", 16, function() {
    var resetCount = 0;
    var models = sub.models;
    sub.on('reset', function() { resetCount += 1; });
    sub.reset([]);
    equal(resetCount, 1);
    equal(sub.length, 0);
    equal(sub.last(), null);
    sub.reset(models);
    equal(resetCount, 2);
    equal(sub.length, 4);
    equal(sub.last(), d);
    sub.reset(_.map(models, function(m){ return m.attributes; }));
    equal(resetCount, 3);
    equal(sub.length, 4);
    ok(sub.last() !== d);
    ok(_.isEqual(sub.last().attributes, d.attributes));
    sub.reset();
    equal(sub.length, 0);
    equal(resetCount, 4);

    var f = new Backbone.Model({id: 20, label : 'f'});
    sub.reset([undefined, f]);
    equal(sub.length, 2);
    equal(resetCount, 5);

    sub.reset(new Array(4));
    equal(sub.length, 4);
    equal(resetCount, 6);
  });

  test ("reset with different values", function(){
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset({id: 1}, {parentCollection: col});
    sub.reset({id: 1, a: 1});
    equal(sub.get(1).get('a'), 1);
  });

  test("same references in reset", function() {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection;
    var subset = new Backbone.Collection({id: 1}, {parentCollection: collection});
    subset.reset(model);
    equal(subset.get(1), model);
  });

  test("reset passes caller options", 3, function() {
    var Model = Backbone.Model.extend({
      initialize: function(attrs, options) {
        this.model_parameter = options.model_parameter;
      }
    });
    var col = new Backbone.Collection;
    var sub = new (Backbone.Subset.extend({ model: Model }))([], {parentCollection: col});
    sub.reset([{ astring: "green", anumber: 1 }, { astring: "blue", anumber: 2 }], { model_parameter: 'model parameter' });
    equal(sub.length, 2);
    sub.each(function(model) {
      equal(model.model_parameter, 'model parameter');
    });
  });

  test("trigger custom events on models", 1, function() {
    var fired = null;
    a.on("custom", function() { fired = true; });
    a.trigger("custom");
    equal(fired, true);
  });

  test("add does not alter arguments", 2, function(){
    var attrs = {};
    var models = [attrs];
    var col = new Backbone.Collection;
    new Backbone.Subset([], {parentCollection: col}).add(models);
    equal(models.length, 1);
    ok(attrs === models[0]);
  });

  test("#714: access `model.collection` in a brand new model.", 2, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.url = '/test';
    var Model = Backbone.Model.extend({
      set: function(attrs) {
        equal(attrs.prop, 'value');
        equal(this.collection, subset);
        return this;
      }
    });
    subset.model = Model;
    subset.create({prop: 'value'});
  });

  test("#574, remove its own reference to the .models array.", 2, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([
      {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
    ], {parentCollection: col});
    equal(sub.length, 6);
    sub.remove(sub.models);
    equal(sub.length, 0);
  });

  test("#861, adding models to a collection which do not pass validation, with validate:true", function() {
      var Model = Backbone.Model.extend({
        validate: function(attrs) {
          if (attrs.id == 3) return "id can't be 3";
        }
      });

      var Subset = Backbone.Subset.extend({
        model: Model
      });

      var collection = new Backbone.Collection;
      var subset = new Subset([], {parentCollection: collection});
      subset.on("error", function() { ok(true); });

      subset.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}], {validate:true});
      deepEqual(subset.pluck('id'), [1, 2, 4, 5, 6]);
  });

  test("Invalid models are discarded with validate:true.", 5, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.on('test', function() { ok(true); });
    subset.model = Backbone.Model.extend({
      validate: function(attrs){ if (!attrs.valid) return 'invalid'; }
    });
    var model = new subset.model({id: 1, valid: true});
    subset.add([model, {id: 2}], {validate:true});
    model.trigger('test');
    ok(subset.get(model.cid));
    ok(subset.get(1));
    ok(!subset.get(2));
    equal(subset.length, 1);
  });

  test("multiple copies of the same model", 3, function() {
    var col = new Backbone.Collection();
    var sub = new Backbone.Subset([], {parentCollection: col});
    var model = new Backbone.Model();
    sub.add([model, model]);
    equal(sub.length, 1);
    sub.add([{id: 1}, {id: 1}]);
    equal(sub.length, 2);
    equal(sub.last().id, 1);
  });

  test("#964 - collection.get return inconsistent", 2, function() {
    var c = new Backbone.Collection();
    var s = new Backbone.Subset([], {parentCollection: c});
    ok(s.get(null) === undefined);
    ok(s.get() === undefined);
  });

  test("#1112 - passing options.model sets collection.model", 2, function() {
    var Model = Backbone.Model.extend({});
    var c = new Backbone.Collection;
    var s = new Backbone.Subset([{id: 1}], {model: Model, parentCollection: c});
    ok(s.model === Model);
    ok(s.at(0) instanceof Model);
  });

  test("null and undefined are invalid ids.", 2, function() {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([model], {parentCollection: collection});
    model.set({id: null});
    ok(!subset.get('null'));
    model.set({id: 1});
    model.set({id: undefined});
    ok(!subset.get('undefined'));
  });

  test("falsy comparator", 4, function(){
    var Sub = Backbone.Subset.extend({
      comparator: function(model){ return model.id; }
    });
    var col = new Backbone.Collection;
    var sub = new Sub([], {parentCollection: col});
    var subFalse = new Sub(null, {comparator: false, parentCollection: col});
    var subNull = new Sub(null, {comparator: null, parentCollection: col});
    var subUndefined = new Sub(null, {comparator: undefined, parentCollection: col});
    ok(sub.comparator);
    ok(!subFalse.comparator);
    ok(!subNull.comparator);
    ok(subUndefined.comparator);
  });

  test("#1355 - `options` is passed to success callbacks", 2, function(){
    var m = new Backbone.Model({x:1});
    var col = new Backbone.Collection();
    var sub = new Backbone.Subset([], {parentCollection: col})
    var opts = {
      success: function(collection, resp, options){
        ok(options);
      }
    };
    sub.sync = m.sync = function( method, collection, options ){
      options.success(collection, [], options);
    };
    sub.fetch(opts);
    sub.create(m, opts);
  });

  test("#1412 - Trigger 'request' and 'sync' events.", 4, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.url = '/test';
    Backbone.ajax = function(settings){ settings.success(); };

    subset.on('request', function(obj, xhr, options) {
      ok(obj === subset, "collection has correct 'request' event after fetching");
    });
    subset.on('sync', function(obj, response, options) {
      ok(obj === subset, "collection has correct 'sync' event after fetching");
    });
    subset.fetch();
    subset.off();

    subset.on('request', function(obj, xhr, options) {
      ok(obj === subset.get(1), "collection has correct 'request' event after one of its models save");
    });
    subset.on('sync', function(obj, response, options) {
      ok(obj === subset.get(1), "collection has correct 'sync' event after one of its models save");
    });
    subset.create({id: 1});
    subset.off();
  });

  test("#1447 - create with wait adds model.", 1, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    var model = new Backbone.Model;
    model.sync = function(method, model, options){ options.success(); };
    subset.on('add', function(){ ok(true); });
    subset.create(model, {wait: true});
  });

  test("#1448 - add sorts collection after merge.", 1, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([
      {id: 1, x: 1},
      {id: 2, x: 2}
    ], {
      parentCollection: collection
    });
    subset.comparator = function(model){ return model.get('x'); };
    subset.add({id: 1, x: 3}, {merge: true});
    deepEqual(subset.pluck('id'), [2, 1]);
  });

  test("#1655 - groupBy can be used with a string argument.", 3, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([{x: 1}, {x: 2}], {parentCollection: collection});
    var grouped = subset.groupBy('x');
    strictEqual(_.keys(grouped).length, 2);
    strictEqual(grouped[1][0].get('x'), 1);
    strictEqual(grouped[2][0].get('x'), 2);
  });

  test("#1655 - sortBy can be used with a string argument.", 1, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([{x: 3}, {x: 1}, {x: 2}], {parentCollection: collection});
    var values = _.map(subset.sortBy('x'), function(model) {
      return model.get('x');
    });
    deepEqual(values, [1, 2, 3]);
  });

  test("#1604 - Removal during iteration.", 0, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([{}, {}], {parentCollection: collection});
    subset.on('add', function() {
      subset.at(0).destroy();
    });
    subset.add({}, {at: 0});
  });

  test("#1638 - `sort` during `add` triggers correctly.", function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.comparator = function(model) { return model.get('x'); };
    var added = [];
    subset.on('add', function(model) {
      model.set({x: 3});
      subset.sort();
      added.push(model.id);
    });
    subset.add([{id: 1, x: 1}, {id: 2, x: 2}]);
    deepEqual(added, [1, 2]);
  });

  test("fetch parses models by default", 1, function() {
    var model = {};
    var Subset = Backbone.Subset.extend({
      url: 'test',
      model: Backbone.Model.extend({
        parse: function(resp) {
          strictEqual(resp, model);
        }
      })
    });
    var col = new Backbone.Collection;
    var sub = new Subset([], {parentCollection: col});
    sub.fetch();
    this.ajaxSettings.success([model]);
  });

  test("`sort` shouldn't always fire on `add`", 1, function() {
    var c = new Backbone.Collection;
    var s = new Backbone.Subset([{id: 1}, {id: 2}, {id: 3}], {
      comparator: 'id',
      parentCollection: c
    });
    s.sort = function(){ ok(true); };
    s.add([]);
    s.add({id: 1});
    s.add([{id: 2}, {id: 3}]);
    s.add({id: 4});
  });

  test("#1407 parse option on constructor parses collection and models", 2, function() {
    var model = {
      namespace : [{id: 1}, {id:2}]
    };
    var Subset = Backbone.Subset.extend({
      model: Backbone.Model.extend({
        parse: function(model) {
          model.name = 'test';
          return model;
        }
      }),
      parse: function(model) {
        return model.namespace;
      }
    });
    var c = new Backbone.Collection;
    var s = new Subset(model, {parse:true, parentCollection: c});

    equal(s.length, 2);
    equal(s.at(0).get('name'), 'test');
  });

  test("Reset includes previous models in triggered event.", 1, function() {
    var model = new Backbone.Model();
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([model], {parentCollection: collection})
    .on('reset', function(collection, options) {
      deepEqual(options.previousModels, [model]);
    });
    subset.reset([]);
  });

  test("set", function() {
    var m1 = new Backbone.Model();
    var m2 = new Backbone.Model({id: 2});
    var m3 = new Backbone.Model();
    var c = new Backbone.Collection();
    var s = new Backbone.Subset([m1, m2], {parentCollection: c});

    // Test add/change/remove events
    s.on('add', function(model) {
      strictEqual(model, m3);
    });
    s.on('change', function(model) {
      strictEqual(model, m2);
    });
    s.on('remove', function(model) {
      strictEqual(model, m1);
    });

    // remove: false doesn't remove any models
    s.set([], {remove: false});
    strictEqual(s.length, 2);

    // add: false doesn't add any models
    c.set([m1, m2, m3], {add: false});
    strictEqual(s.length, 2);

    // merge: false doesn't change any models
    s.set([m1, {id: 2, a: 1}], {merge: false});
    strictEqual(m2.get('a'), void 0);

    // add: false, remove: false only merges existing models
    s.set([m1, {id: 2, a: 0}, m3, {id: 4}], {add: false, remove: false});
    strictEqual(s.length, 2);
    strictEqual(m2.get('a'), 0);

    // default options add/remove/merge as appropriate
    s.set([{id: 2, a: 1}, m3]);
    strictEqual(s.length, 2);
    strictEqual(m2.get('a'), 1);

    // Test removing models not passing an argument
    s.off('remove').on('remove', function(model) {
      ok(model === m2 || model === m3);
    });
    s.set([]);
    strictEqual(s.length, 0);
  });

  test("set with only cids", 3, function() {
    var m1 = new Backbone.Model;
    var m2 = new Backbone.Model;
    var c = new Backbone.Collection;
    var s = new Backbone.Subset([], {parentCollection: c});
    s.set([m1, m2]);
    equal(s.length, 2);
    s.set([m1]);
    equal(s.length, 1);
    s.set([m1, m1, m1, m2, m2], {remove: false});
    equal(s.length, 2);
  });

  test("set with only idAttribute", 3, function() {
    var m1 = { _id: 1 };
    var m2 = { _id: 2 };
    var Sub = Backbone.Collection.extend({
      model: Backbone.Model.extend({
        idAttribute: '_id'
      })
    });
    var c = new Backbone.Collection;
    var s = new Sub([], {parentCollection: c});
    s.set([m1, m2]);
    equal(s.length, 2);
    s.set([m1]);
    equal(s.length, 1);
    s.set([m1, m1, m1, m2, m2], {remove: false});
    equal(s.length, 2);
  });

  test("set + merge with default values defined", function() {
    var Model = Backbone.Model.extend({
      defaults: {
        key: 'value'
      }
    });
    var m = new Model({id: 1});
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([m], {model: Model, parentCollection: col});
    equal(sub.first().get('key'), 'value');

    sub.set({id: 1, key: 'other'});
    equal(sub.first().get('key'), 'other');

    sub.set({id: 1, other: 'value'});
    equal(sub.first().get('key'), 'other');
    equal(sub.length, 1);
  });

  test('merge without mutation', function () {
    var Model = Backbone.Model.extend({
      initialize: function (attrs, options) {
        if (attrs.child) {
          this.set('child', new Model(attrs.child, options), options);
        }
      }
    });
    var Subset = Backbone.Collection.extend({model: Model});
    var data = [{id: 1, child: {id: 2}}];
    var collection = new Backbone.Collection;
    var subset = new Subset(data, {parentCollection: collection});
    equal(subset.first().id, 1);
    subset.set(data);
    equal(subset.first().id, 1);
    subset.set([{id: 2, child: {id: 2}}].concat(data));
    deepEqual(subset.pluck('id'), [2, 1]);
  });

  test("`set` and model level `parse`", function() {
    var Model = Backbone.Model.extend({});
    var Subset = Backbone.Collection.extend({
      model: Model,
      parse: function (res) { return _.pluck(res.models, 'model'); }
    });
    var model = new Model({id: 1});
    var collection = new Backbone.Collection;
    var subset = new Subset(model, {parentCollection: collection});
    subset.set({models: [
      {model: {id: 1}},
      {model: {id: 2}}
    ]}, {parse: true});
    equal(subset.first(), model);
  });

  test("`set` data is only parsed once", function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.model = Backbone.Model.extend({
      parse: function (data) {
        equal(data.parsed, void 0);
        data.parsed = true;
        return data;
      }
    });
    subset.set({}, {parse: true});
  });

  test('`set` matches input order in the absence of a comparator', function () {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([one, two, three], {parentCollection: collection});
    subset.set([{id: 3}, {id: 2}, {id: 1}]);
    deepEqual(subset.models, [three, two, one]);
    subset.set([{id: 1}, {id: 2}]);
    deepEqual(subset.models, [one, two]);
    subset.set([two, three, one]);
    deepEqual(subset.models, [two, three, one]);
    subset.set([{id: 1}, {id: 2}], {remove: false});
    deepEqual(subset.models, [two, three, one]);
    subset.set([{id: 1}, {id: 2}, {id: 3}], {merge: false});
    deepEqual(subset.models, [one, two, three]);
    subset.set([three, two, one, {id: 4}], {add: false});
    deepEqual(subset.models, [one, two, three]);
  });

  test("#1894 - Push should not trigger a sort", 0, function() {
    var Subset = Backbone.Collection.extend({
      comparator: 'id',
      sort: function() {
        ok(false);
      }
    });
    var c = new Backbone.Collection;
    new Subset([], {parentCollection: c}).push({id: 1});
  });

  test("#2428 - push duplicate models, return the correct one", 1, function() {
    var col = new Backbone.Collection;
    var sub = new Backbone.Subset([], {parentCollection: col});
    var model1 = sub.push({id: 101});
    var model2 = sub.push({id: 101})
    ok(model2.cid == model1.cid);
  });

  test("`set` with non-normal id", function() {
    var Subset = Backbone.Collection.extend({
      model: Backbone.Model.extend({idAttribute: '_id'})
    });
    var colleciton = new Backbone.Collection;
    var subset = new Subset({_id: 1});
    subset.set([{_id: 1, a: 1}], {add: false});
    equal(subset.first().get('a'), 1);
  });

  test("#1894 - `sort` can optionally be turned off", 0, function() {
    var Subset = Backbone.Collection.extend({
      comparator: 'id',
      sort: function() { ok(true); }
    });
    var c = new Backbone.Collection;
    new Subset([], {parentCollection: c}).add({id: 1}, {sort: false});
  });

  test("#1915 - `parse` data in the right order in `set`", function() {
    var collection = new Backbone.Collection;
    var subset = new (Backbone.Subset.extend({
      parse: function (data) {
        strictEqual(data.status, 'ok');
        return data.data;
      }
    }))([], {parentCollection: collection});
    var res = {status: 'ok', data:[{id: 1}]};
    subset.set(res, {parse: true});
  });

  asyncTest("#1939 - `parse` is passed `options`", 1, function () {
    var collection = new Backbone.Collection;
    var subset = new (Backbone.Subset.extend({
      url: '/',
      parse: function (data, options) {
        strictEqual(options.xhr.someHeader, 'headerValue');
        return data;
      }
    }))([], {parentCollection: collection});
    var ajax = Backbone.ajax;
    Backbone.ajax = function (params) {
      _.defer(params.success);
      return {someHeader: 'headerValue'};
    };
    subset.fetch({
      success: function () { start(); }
    });
    Backbone.ajax = ajax;
  });

  test("`add` only `sort`s when necessary", 2, function () {
    var collection = new Backbone.Collection;
    var subset = new (Backbone.Subset.extend({
      comparator: 'a'
    }))([{id: 1}, {id: 2}, {id: 3}], {parentCollection: collection});
    subset.on('sort', function () { ok(true); });
    subset.add({id: 4}); // do sort, new model
    subset.add({id: 1, a: 1}, {merge: true}); // do sort, comparator change
    subset.add({id: 1, b: 1}, {merge: true}); // don't sort, no comparator change
    subset.add({id: 1, a: 1}, {merge: true}); // don't sort, no comparator change
    subset.add(subset.models); // don't sort, nothing new
    subset.add(subset.models, {merge: true}); // don't sort
  });

  test("`add` only `sort`s when necessary with comparator function", 3, function () {
    var collection = new Backbone.Collection;
    var subset = new (Backbone.Subset.extend({
      comparator: function(a, b) {
        return a.get('a') > b.get('a') ? 1 : (a.get('a') < b.get('a') ? -1 : 0);
      }
    }))([{id: 1}, {id: 2}, {id: 3}], {parentCollection: collection});
    subset.on('sort', function () { ok(true); });
    subset.add({id: 4}); // do sort, new model
    subset.add({id: 1, a: 1}, {merge: true}); // do sort, model change
    subset.add({id: 1, b: 1}, {merge: true}); // do sort, model change
    subset.add({id: 1, a: 1}, {merge: true}); // don't sort, no model change
    subset.add(subset.models); // don't sort, nothing new
    subset.add(subset.models, {merge: true}); // don't sort
  });

  test("Attach options to collection.", 2, function() {
    var model = new Backbone.Model;
    var comparator = function(){};

    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {
      model: model,
      comparator: comparator,
      parentCollection: collection
    });

    ok(subset.model === model);
    ok(subset.comparator === comparator);
  });

  test("`add` overrides `set` flags", function () {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.once('add', function (model, collection, options) {
      collection.add({id: 2}, options);
    });
    subset.set({id: 1});
    equal(subset.length, 2);
  });

  test("#2606 - Collection#create, success arguments", 1, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.url = 'test';
    subset.create({}, {
      success: function(model, resp, options) {
        strictEqual(resp, 'response');
      }
    });
    this.ajaxSettings.success('response');
  });

  test("#2612 - nested `parse` works with `Collection#set`", function() {

    var Job = Backbone.Model.extend({
      constructor: function() {
        this.items = new Backbone.Subset([], {parentCollection: allItems});
        Backbone.Model.apply(this, arguments);
      },
      parse: function(attrs) {
        this.items.set(attrs.items, {parse: true});
        return _.omit(attrs, 'items');
      }
    });

    Item = Backbone.Model.extend({
      constructor: function() {
        this.subItems = new Backbone.Subset([], {parentCollection: allItems});
        Backbone.Model.apply(this, arguments);
      },
      parse: function(attrs) {
        this.subItems.set(attrs.subItems, {parse: true});
        return _.omit(attrs, 'subItems');
      }
    });

    var Items = Backbone.Collection.extend({
      model: Item
    });
    var allItems = new Items;

    var data = {
      name: 'JobName',
      id: 1,
      items: [{
        id: 1,
        name: 'Sub1',
        subItems: [
          {id: 1, subName: 'One'},
          {id: 2, subName: 'Two'}
        ]
      }, {
        id: 2,
        name: 'Sub2',
        subItems: [
          {id: 3, subName: 'Three'},
          {id: 4, subName: 'Four'}
        ]
      }]
    };

    var newData = {
      name: 'NewJobName',
      id: 1,
      items: [{
        id: 1,
        name: 'NewSub1',
        subItems: [
          {id: 1,subName: 'NewOne'},
          {id: 2,subName: 'NewTwo'}
        ]
      }, {
        id: 2,
        name: 'NewSub2',
        subItems: [
          {id: 3,subName: 'NewThree'},
          {id: 4,subName: 'NewFour'}
        ]
      }]
    };

    job = new Job(data, {parse: true});
    equal(job.get('name'), 'JobName');
    equal(job.items.at(0).get('name'), 'Sub1');
    equal(job.items.length, 2);
    equal(job.items.get(1).subItems.get(1).get('subName'), 'One');
    equal(
      job.items
      .get(2).subItems
      .get(3)
      .get('subName'), 'Three'
    );
    job.set(job.parse(newData, {parse: true}));
    equal(job.get('name'), 'NewJobName');
    equal(job.items.at(0).get('name'), 'NewSub1');
    equal(job.items.length, 2);
    equal(job.items.get(1).subItems.get(1).get('subName'), 'NewOne');
    equal(job.items.get(2).subItems.get(3).get('subName'), 'NewThree');
  });

  test('_addReference binds all collection events & adds to the lookup hashes', 9, function() {

    var calls = {add: 0, remove: 0};

    var Subset = Backbone.Collection.extend({

      _addReference: function(model) {
        Backbone.Subset.prototype._addReference.apply(this, arguments);
        calls.add++;
        equal(model, this._byId[model.id]);
        equal(model, this._byId[model.cid]);
        equal(model._events.all.length, 1);
      },

      _removeReference: function(model) {
        Backbone.Subset.prototype._removeReference.apply(this, arguments);
        calls.remove++;
        equal(this._byId[model.id], void 0);
        equal(this._byId[model.cid], void 0);
        equal(model.collection, void 0);
        equal(model._events.all, void 0);
      }

    });

    var collection = new Backbone.Collection;
    var subset = new Subset([], {parentCollection: collection});
    var model = subset.add({id: 1});
    subset.remove(model);

    equal(calls.add, 1);
    equal(calls.remove, 1);

  });

  test('Do not allow duplicate models to be `add`ed or `set`', function() {
    var c = new Backbone.Collection;
    var s = new Backbone.Subset([], {parentCollection: c});

    s.add([{id: 1}, {id: 1}]);
    equal(s.length, 1);
    equal(s.models.length, 1);

    s.set([{id: 1}, {id: 1}]);
    equal(s.length, 1);
    equal(s.models.length, 1);
  });

  test('#3020: #set with {add: false} should not throw.', 2, function() {
    var collection = new Backbone.Collection;
    var subset = new Backbone.Subset([], {parentCollection: collection});
    subset.set([{id: 1}], {add: false});
    strictEqual(subset.length, 0);
    strictEqual(subset.models.length, 0);
  });

  test("create with wait, model instance, #3028", 1, function() {
    var collection = new Backbone.Collection();
    var subset = new Backbone.Subset([], {parentCollection: collection});
    var model = new Backbone.Model({id: 1});
    model.sync = function(){
      equal(this.collection, subset);
    };
    subset.create(model, {wait: true});
  });

  test("modelId", function() {
    var Stooge = Backbone.Model.extend();
    var StoogeSubset = Backbone.Subset.extend({model: Stooge});

    // Default to using `Collection::model::idAttribute`.
    equal(StoogeSubset.prototype.modelId({id: 1}), 1);
    Stooge.prototype.idAttribute = '_id';
    equal(StoogeSubset.prototype.modelId({_id: 1}), 1);
  });

  test('Polymorphic models work with "simple" constructors', function () {
    var A = Backbone.Model.extend();
    var B = Backbone.Model.extend();
    var S = Backbone.Subset.extend({
      model: function (attrs) {
        return attrs.type === 'a' ? new A(attrs) : new B(attrs);
      }
    });
    var collection = new Backbone.Collection;
    var subset = new S([{id: 1, type: 'a'}, {id: 2, type: 'b'}], {
      parentCollection: collection
    });
    equal(subset.length, 2);
    ok(subset.at(0) instanceof A);
    equal(subset.at(0).id, 1);
    ok(subset.at(1) instanceof B);
    equal(subset.at(1).id, 2);
  });

  test('Polymorphic models work with "advanced" constructors', function () {
    var A = Backbone.Model.extend({idAttribute: '_id'});
    var B = Backbone.Model.extend({idAttribute: '_id'});
    var S = Backbone.Subset.extend({
      model: Backbone.Model.extend({
        constructor: function (attrs) {
          return attrs.type === 'a' ? new A(attrs) : new B(attrs);
        },

        idAttribute: '_id'
      })
    });
    var collection = new Backbone.Collection;
    var subset = new S([{_id: 1, type: 'a'}, {_id: 2, type: 'b'}], {
      parentCollection: collection
    });
    equal(subset.length, 2);
    ok(subset.at(0) instanceof A);
    equal(subset.at(0), subset.get(1));
    ok(subset.at(1) instanceof B);
    equal(subset.at(1), subset.get(2));

    S = Backbone.Subset.extend({
      model: function (attrs) {
        return attrs.type === 'a' ? new A(attrs) : new B(attrs);
      },

      modelId: function (attrs) {
        return attrs.type + '-' + attrs.id;
      }
    });
    collection = new Backbone.Collection;
    subset = new S([{id: 1, type: 'a'}, {id: 1, type: 'b'}], {
      parentCollection: collection
    });
    equal(subset.length, 2);
    ok(subset.at(0) instanceof A);
    equal(subset.at(0), subset.get('a-1'));
    ok(subset.at(1) instanceof B);
    console.log(subset.models)
    equal(subset.at(1), subset.get('b-1'));
  });

})();
