(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле main_directive.js

  app
    .directive('serverStatusFilter', serverStatusFilter)
    .directive('serverTypeFilter', serverTypeFilter);

  function serverStatusFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="serverPage.changeFilter()"' +
      ' ng-model="serverPage.selectedStatusOption" ng-options="option.value as option.string for option in' +
      ' serverPage.statusOptions"></select>'
    }
  }

  function serverTypeFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="serverPage.changeFilter()"' +
      ' ng-model="serverPage.selectedTypeOption" ng-options="option.id as option.name for option in' +
      ' serverPage.typeOptions"></select>'
    }
  }
})();