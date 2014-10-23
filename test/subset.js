(function() {

  var model, col, sub;

  module("Backbone.Subset", {
    setup: function () {
      model = new Backbone.Model({id: 1, prop: 'value'});
      col   = new Backbone.Collection;
      sub   = new Backbone.Subset([], {parentCollection: col});
    }
  });

  test("`add` adds models to parentCollection if it's not there", 2, function () {
    sub.add(model);

    equal(col.length, 1);
    equal(col.first(), model);
  });

  test('takes model from parent if parent has it', 2, function () {
    col.add(model);
    var newModel = new Backbone.Model(model.attributes);
    sub.add(newModel);

    equal(col.first(), sub.first());
    ok(!newModel.collection)
  });

  test("inherits `url`, `model`, and `comparator` from parent if they're not defined", 3, function () {
    col.model = Backbone.Model.extend();
    col.url = '/test';
    col.comparator = 'id';
    var sub = new Backbone.Subset([], {parentCollection: col});

    equal(col.url, sub.url);
    equal(col.model, sub.model);
    equal(col.comparator, sub.comparator);
  });

  test("sets new attributes on model in parent on `add`", 1, function () {
    col.add(model);
    sub.add({id: 1, prop: 'another value'});

    equal(model.get('prop'), 'another value');
  });



})();
