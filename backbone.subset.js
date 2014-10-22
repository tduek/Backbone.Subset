(function () {
  var Subset = Backbone.Subset = function (models, options) {
    options || (options = {});
    if (options.parentCollection instanceof Backbone.Collection) {
      this.parentCollection = options.parentCollection;
      if (options.model) {
        this.model = options.model;
      }
      else if (
        this.model === Backbone.Model &&
        this.parentCollection.model !== Backbone.Model
      ) {
        this.model = this.parentCollection.model;
      }
    } else {
      throw 'ArgumentError: Must supply an instanceof Backbone.Collection as parentCollection';
    }
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.add(models, _.extend({silent: true}, options));
  };

  Subset.extend = Backbone.Collection.extend;
  Subset.prototype = Object.create(Backbone.Collection.prototype);

  _.extend(Subset.prototype, {
    constructor: Subset,

    _prepareModel: function(attrs, options) {
      var existingInParent, id, tagetModel, parent;
      parent = this.parentCollection, targetModel = this.model;

      if (attrs) id = this.modelId(attrs);
      if (existingInParent = (id && this.parentCollection.get(id))) {
        attrs = (this._isModel(attrs)) ? attrs.attributes : attrs;
        if (options.parse) attrs = existingInParent.parse(attrs);
        existingInParent.set(attrs, options);
        return existingInParent;
      }

      if (attrs instanceof Backbone.Model) {
        if (!attrs.collection) attrs.collection = this;
        parent.add(attrs);
        return attrs;
      }

      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new targetModel(attrs, options);
      if (!model.validationError) {
        model.collection = this;
        parent.add(model);
        return model;
      }

      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    clone: function () {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator,
        parentCollection: this.parentCollection
      });
    }
  });

})();