# Backbone.Subset

Hi! This is an extension for Backbone that gives you a new class, Backbone.Subset. It allows you to have one main `Backbone.Collection` that holds all of your models, and then multiple `Backbone.Subset`s that hold some of the models that are already in your main Collection.

## Purpose

The goal is to reduce data duplication and prevent situations in which you may have two different models for the same DB resource, opening yourself up to the possibility of the two models being out of sync.

#### For example

Imagine you have a car classifieds site where you can see listings of cars for sale. Users have the ability to 'favorite' cars. You may have a `Collection` of the cars you want to display on the index of listings and another `Collection` of the cars the user has favorited.

You may have the same car in both `Collection`s, but as different `Model` instances. This opens you up to the possibility of having out-of-sync `Model`s, where it is favorited in one collection, but not in the other.

Backbone.Subset fixes this by creating subsets of one parent collection. The parent collection holds all of the models, and the subset has a subset of that collection. The `Model`s are the same instances in your parent collection and all its subsets, eliminating the possibility of ever being out of sync.

## Getting Started

Backbone.Subset behaves just like a regular collection. You won't notice any difference until you start doing more advanced customization.

```javascript
// Make some parent collection and subset classes
var modelClass = Backbone.Model.extend({});

var parentCollectionClass = Backbone.Collection.extend({
  model: modelClass
});

var subsetClass = Backbone.Subset.extend({})


// Instantiate them
var parentCollection = new parentCollectionClass();
var subset = new subsetClass([], { parentCollection: parentCollection });
```

The only difference with a regular `Backbone.Collection` is that when you
instantiate the `Subset`, you have to give it an instance of
`Backbone.Collection` as the `parentCollection` in the options object.


## Add Some Models

Simple, just like a regular Collection:

```javascript
var newModel = new Backbone.Model({ id: 1 })
var newModels = [newModel, { id: 2 }];

subset.add(newModels);

subset.models // => 2 instances of modelClass, ids: [1, 2]
parentCollection.models // => 2 instances of modelClass, ids: [1, 2]
```

#### Only ever have one Model instance of a resource:

```javascript
subset.models // => 2 instances of modelClass, ids: [1, 2]

// Another Subset
var otherSubset = new subsetClass([], { parentCollection: parentCollection });

// Add a model into otherSubset
otherSubset.add({ id: 3 });


otherSubset.models //=> 1 instance of modelClass, id: 3

// Automatically added to parentCollection
parentCollection.models // => 3 instances of modelClass, ids: [1, 2, 3]

// Not in the origin subset
subset.models //=> 2 instances of modelClass, ids: [1, 2]
```

## TODO

- TESTS!





