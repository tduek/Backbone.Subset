(function() {

  var a, b, c, d, e, col, otherCol;

  module("Backbone.Subset", {

    setup: function() {
      a         = new Backbone.Model({id: 3, label: 'a'});
      b         = new Backbone.Model({id: 2, label: 'b'});
      c         = new Backbone.Model({id: 1, label: 'c'});
      d         = new Backbone.Model({id: 0, label: 'd'});
      e         = null;
      col       = new Backbone.Collection([a,b,c,d]);
      otherCol  = new Backbone.Collection();
    }

  });



})();
