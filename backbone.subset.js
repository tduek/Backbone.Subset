(function () {
  var Subset = Backbone.Subset = function (models, options) {
    options || (options = {});
    if (options.parentCollection instanceof Backbone.Collection) {
      this.parentCollection = options.parentCollection;
      this.model = this.parentCollection.model;
    } else {
      throw 'ArgumentError: Must supply an instanceof Backbone.Collection as parentCollection';
    }

    if (options.comparator) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.add(models, _.extend({silent: true}, options));
  };

  Subset.extend = Backbone.Collection.extend;
  Subset.prototype = Object.create(Backbone.Collection.prototype);

  Subset.prototype._prepareModel = function(attrs, options) {
    var existingInParent, id, tagetModel, parent;
    parent = this.parentCollection, targetModel = this.model;

    id = attrs[targetModel.prototype.idAttribute || 'id'];
    if (existingInParent = this.parentCollection.get(id)) {
      return existingInParent;
    }

    if (attrs instanceof Backbone.Model) {
      parent.add(attrs);
      return attrs;
    }

    options = options ? _.clone(options) : {};
    options.collection = this;
    var model = new targetModel(attrs, options);
    if (!model.validationError) {
      parent.add(model);
      return model;
    }

    this.trigger('invalid', this, model.validationError, options);
    return false;
  };

})();