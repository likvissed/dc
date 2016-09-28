(function() {
  'use strict';

  app
    .directive('serviceFilter', serviceFilter);

  function serviceFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="servicePage.changeFilter()"  ng-model="servicePage.selectedOption" ng-options="option as option.string for option in servicePage.options track by option.value"></select>',
    }
  }
})();