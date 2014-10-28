(function () {
  var Subset = Backbone.Subset = function (models, options) {
    options || (options = {});

    if (options.parentCollection) this.parentCollection = options.parentCollection;
    if (!(this.parentCollection instanceof Backbone.Collection)) {
      throw 'ArgumentError: Must supply an instanceof Backbone.Collection as parentCollection';
    }

    var subset = this;
    _(['model', 'comparator', 'url']).each(function (prop) {
      if (options[prop] !== void 0) {
        subset[prop] = options[prop];
      } else if (
        subset[prop] === Subset.prototype[prop] &&
        !subset.constructor.prototype.hasOwnProperty(prop) &&
        subset.parentCollection[prop] !== Subset.prototype[prop]
      ) {
        subset[prop] = subset.parentCollection[prop];
      }
    });

    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.add(models, _.extend({silent: true}, options));
  };

  Subset.extend = Backbone.Collection.extend;
  Subset.prototype = Object.create(Backbone.Collection.prototype);

  _.extend(Subset.prototype, {
    constructor: Subset,

    _prepareModel: function(attrs, options) {
      var existingInParent, id, parent;
      parent = this.parentCollection;

      if (attrs) id = this.modelId(attrs);
      if (existingInParent = (id && this.parentCollection.get(id))) {
        attrs = (this._isModel(attrs)) ? attrs.attributes : attrs;
        if (options.parse) attrs = existingInParent.parse(attrs);
        existingInParent.set(attrs, options);
        return existingInParent;
      }

      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        parent.add(attrs, options);
        return attrs;
      }

      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
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