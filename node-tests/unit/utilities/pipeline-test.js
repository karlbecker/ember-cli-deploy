var Promise  = require('ember-cli/lib/ext/promise');
var Pipeline = require('../../../lib/utilities/pipeline');

var expect   = require('../../helpers/expect');

describe ('Pipeline', function() {
  describe ('initialization', function() {
    it ('initializes the given list of hooks', function() {
      var subject = new Pipeline(['willDeploy', 'didDeploy']);

      expect(Object.keys(subject._pipelineHooks).length).to.eq(2);
      expect(subject._pipelineHooks.willDeploy).to.eql([]);
      expect(subject._pipelineHooks.didDeploy).to.eql([]);
    });
  });

  describe ('#register', function() {
    it ('registers functions for defined hooks', function() {
      var subject = new Pipeline(['willDeploy']);
      var fn      = function() {};

      subject.register('willDeploy', fn);

      expect(subject._pipelineHooks.willDeploy.length).to.eq(1)
      expect(subject._pipelineHooks.willDeploy[0]).to.eql(fn);
    });

    it ('doesn\'t register functions for hooks not defined', function() {
      var subject = new Pipeline(['willDeploy']);
      var fn      = function() {};

      subject.register('build', fn);

      expect(subject._pipelineHooks.willDeploy.length).to.eq(0)
      expect(subject._pipelineHooks.build).to.eq(undefined);
    });
  });

  describe ('#execute', function() {
    it ('runs the registered functions', function() {
      var subject = new Pipeline(['hook1', 'hook2']);
      var hooksRun = [];

      subject.register('hook1', function() {
        hooksRun.push('1');
      });

      subject.register('hook2', function() {
        hooksRun.push('2');
      });

      return expect(subject.execute()).to.be.fulfilled
        .then(function() {
          expect(hooksRun.length).to.eq(2);
          expect(hooksRun[0]).to.eq('1');
          expect(hooksRun[1]).to.eq('2');
        });
    });

    it('passes the default context object when one isn\'t provided', function() {
      var subject = new Pipeline(['hook1']);
      var data = null;

      subject.register('hook1', function(context) {
        data = context;
      });

      return expect(subject.execute()).to.be.fulfilled
        .then(function() {
          expect(data).to.deep.equal({});
        });
    });

    it('passes the provided context object to hooks when provided', function() {
      var subject = new Pipeline(['hook1']);
      var data = null;

      subject.register('hook1', function(context) {
        data = context;
      });

      return expect(subject.execute({deploy: {}})).to.be.fulfilled
        .then(function() {
          expect(data).to.deep.equal({deploy: {}});
        });
    });

    it('merges the return value (object) of each hook into the context', function() {
      var subject = new Pipeline(['hook1']);
      var finalContext = null;

      subject.register('hook1', function(context) {
        return {age: 47};
      });

      subject.register('hook1', function(context) {
        finalContext = context;
      });

      return expect(subject.execute({name: 'test-context'})).to.be.fulfilled
        .then(function() {
          expect(finalContext.name).to.equal('test-context');
          expect(finalContext.age).to.equal(47);
        });
    });

    it('merges the return value (promise) of each hook into the context', function() {
      var subject = new Pipeline(['hook1']);
      var finalContext = null;

      subject.register('hook1', function(context) {
        return Promise.resolve({age: 47});
      });

      subject.register('hook1', function(context) {
        finalContext = context;
      });

      return expect(subject.execute({name: 'test-context'})).to.be.fulfilled
        .then(function() {
          expect(finalContext.name).to.equal('test-context');
          expect(finalContext.age).to.equal(47);
        });
    });
  });
});
