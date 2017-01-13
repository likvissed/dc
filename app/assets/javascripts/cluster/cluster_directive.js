(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле main_directive.js

  app
    .directive('clusterDeptFilter', clusterDeptFilter)
    .directive('clusterTypeFilter', clusterTypeFilter);

  function clusterDeptFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="clusterPage.changeFilter()"  ng-model="clusterPage.selectedDeptOption" ng-options="option.dept for option in clusterPage.deptOptions track by option.dept"></select>'
    }
  }

  function clusterTypeFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="clusterPage.changeFilter()"  ng-model="clusterPage.selectedTypeOption" ng-options="option as option.name for option in clusterPage.typeOptions track by option.id"></select>'
    }
  }
})();