(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле service_directive.js

  app
    .directive('detailTypeFilter', detailTypeFilter);

  function detailTypeFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="serverPartPage.changeFilter()"  ng-model="serverPartPage.selectedTypeOption" ng-options="option as option.name for option in serverPartPage.typeOptions track by option.id"></select>'
    }
  }
})();