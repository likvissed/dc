(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле main_directive.js

  app
    .directive('serviceFilter', serviceFilter)
    .directive('serviceExploitation', serviceExploitation);

  function serviceFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="servicePage.changeFilter()"  ng-model="servicePage.selectedOption" ng-options="option.value as option.string for option in servicePage.options"></select>'
    }
  }

  function serviceExploitation() {
    return {
      restrict: 'C',
      template: '<div class="btn-group btn-group-justified" data-toggle="buttons" ng-click="servicePage.showProjects()"><label class="btn btn-default" ng-class="{ active: servicePage.exploitation == \'false\' }"><input type="checkbox" ng-model="servicePage.exploitation">Показать с проектами</label></div>'
    }
  }
})();