(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле main_directive.js

  app
    .directive('clusterDeptFilter', clusterDeptFilter)
    .directive('clusterTypeFilter', clusterTypeFilter)
    .directive('clusterStatusFilter', clusterStatusFilter);

  // Фильтр по отделам
  function clusterDeptFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="clusterPage.changeFilter()"' +
      ' ng-model="clusterPage.selectedDeptOption" ng-options="option.dept as option.dept for option in' +
      ' clusterPage.deptOptions"></select>'
    }
  }

  // Фильтр по типу сервера
  function clusterTypeFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="clusterPage.changeFilter()"' +
      ' ng-model="clusterPage.selectedTypeOption" ng-options="option.id as option.name for option in' +
      ' clusterPage.typeOptions"></select>'
    }
  }

  // Фильтр по статусу сервера
  function clusterStatusFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="clusterPage.changeFilter()"' +
      ' ng-model="clusterPage.selectedStatusOption" ng-options="option.value as option.string for option in' +
      ' clusterPage.statusOptions"></select>'
    }
  }
})();