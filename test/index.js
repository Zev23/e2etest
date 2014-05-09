//RUN `start-selenium &` first!
//Angularjs version tested: 1.3.0-beta.7
//webdriverjs 1.6.1

var
webdriverjs = require('webdriverjs'), //Refere to http://webdriver.io for more info
    assert = require('assert');

describe('E2E testing AngularJS without Protractor - ', function() {
    this.timeout(99999999);
    var client = {};
    var siteUrl = 'http://www.angularjs.org';

    before(function() {
        client = webdriverjs.remote({
            desiredCapabilities: {
                browserName: 'chrome'
            }
        });
        client.init();
    });

    after(function(done) {
        client.end(done);
    });

    it('Takes Screenshot', function(done) {
        client
            .url(siteUrl)
            .getTitle(function(err, title) {
                assert(err === null, "getTitle Error");
                assert(title === 'AngularJS — Superheroic JavaScript MVW Framework');
            })
            .saveScreenshot(__dirname + '/screenshots/home.png', function(err, image) {
                assert(err === null);
            })
            .call(done);
    });

    it('Gets element(s) by ng-model', function(done) {
        //Check against [ng-model] should be enough, but
        //as some sites may require HTML compliant certification
        //[data-*] or [x-*] are used.
        var selector = '[data-ng-model="yourName"],[x-ng-model="yourName"],[ng-model="yourName"]';
        var testVal = 'Foo Bar';
        client
            .url(siteUrl)
            .windowHandleMaximize() //Make sure input element is visible.
        .setValue(selector, testVal, function(err) {
            assert(err === null, "setValue error: " + err);
        })
            .getValue(selector, function(err, val) {
                assert(err === null, "getValue error: " + err);
                assert(val === testVal);
            })
            .call(done);
    });

    it('Gets element(s) by ng-binding', function(done) {
        //Binding can be '{{branch.version}}'' or 'branch.version'
        //Remove '{{}}' and extract only the binding name.
        var binding = '{{branch.version}}'.replace(/(\s*{{)(.*)(}}\s*)/g, function(match, p1, p2, p3) {
            return p2;
        });
        var selector = '.ng-binding'; //Css Selector to find all ng-bind or {{Binding}}
        var matchList = []; //Keeps a list of element(s) containing binding

        client
            .url(siteUrl)

        .elements(selector, function(err, res) {
            //Find elements by css selector
            assert(err === null, "elements error");
            assert(res, "res error");

            //Foreach element, check binding match       
            res.value.forEach(function(elemId) {

                //Make a javascript execute(client-script, element, callback)
                //and get the binding value 
                client.execute(
                    function() {
                        return this.angular.element(arguments[0]).data('$binding');
                    },
                    elemId, //The arguments[0]
                    function(err, res) {
                        assert(err === null, "res.value.forEach error");

                        //Check binding with curly brackets ({{}});
                        if (Array.isArray(res.value) && res.value[0].expressions && res.value[0].expressions.indexOf(binding) >= 0) {
                            matchList.push(elemId);
                        } else
                        //Check binding with ng-bind attribute  
                        if (res.value === binding) {
                            matchList.push(elemId);
                        }
                    });
            });
        })

        //Using pause command here to make sure matchList is populated before hand 
        .pause(0, function() {
            assert(matchList.length === 2, "List not match. Current matchList.length: " + matchList.length);
        })

        .call(done);
    });

    it('Get element(s) by ng-repeat (Return row(s))', function(done) {
        var rowIdx = 0;
        var selector = '[ng-repeat^="todo in todos"]';
        var matchList = [];

        client
            .url(siteUrl)
            .elements(selector, function(err, res) {
                assert(err === null, "elements error");
                assert(res, "res error");

                if (rowIdx != null) {
                    matchList.push(res.value[rowIdx]);
                } else {
                    matchList = res.value;
                }
            })
            .pause(0, function() {
                assert(matchList.length === 1, "List not match. Current matchList.length: " + matchList.length);
            })
            .call(done);
    });

    it('Get element(s) by ng-repeat (Return specific column row(s))', function(done) {
        var rowIdx = 1;
        var column = 'todo.text';
        var selector = '[ng-repeat^="todo in todos"]';
        var matchList = [];

        client
            .url(siteUrl)
            .elements(selector, function(err, res) {
                assert(err === null, "elements error");
                assert(res, "res error");

                res.value.forEach(function(elemId, idx) {

                    if (rowIdx == null || rowIdx === idx) {
                        client.execute(
                            function() {
                                return this.angular.element(arguments[0]).children();
                            },
                            elemId, //The arguments[0]
                            function(err, res) {
                                if (err) {
                                    return;
                                }

                                //Loop through children
                                res.value.forEach(function(childId) {

                                    client.execute(
                                        function() {
                                            return this.angular.element(arguments[0]).data('$binding');
                                        },
                                        childId, //The arguments[0]
                                        function(err, res) {
                                            if (err) {
                                                return;
                                            }

                                            //Check binding with curly brackets ({{}});
                                            if (Array.isArray(res.value) && res.value[0].expressions && res.value[0].expressions.indexOf(column) >= 0) {
                                                matchList.push(childId);
                                            } else
                                            //Check binding with ng-bind attribute  
                                            if (res.value === column) {
                                                matchList.push(childId);
                                            }
                                        });
                                });
                            }

                        );
                    }

                })
            })
            .pause(0, function() {
                assert(matchList.length === 1, "List not match. Current matchList.length: " + matchList.length);
            })
            .call(done);
    });
});
