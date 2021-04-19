(function() {
  'use strict';

  // Чтобы директивы скомпилировались, необходимо их добавить в функцию линковки в файле main_directive.js

  app
    .directive('serviceFilter', serviceFilter)
    .directive('serviceExploitation', serviceExploitation)
    .directive('ngValueBlank', ngValueBlank)
    .directive('fileServiceEvent', fileServiceEvent)
    .directive('addNewService', addNewService)
    .directive('addServiceBased', addServiceBased);

  function serviceFilter() {
    return {
      restrict: 'C',
      template: '<select class="form-control" ng-change="servicePage.changeFilter()"' +
      ' ng-model="servicePage.selectedOption" ng-options="option.value as option.string for option in' +
      ' servicePage.options"></select>'
    }
  }

  function serviceExploitation() {
    return {
      restrict: 'C',
      template: '<div class="btn-group btn-group-justified" data-toggle="buttons"' +
      ' ng-click="servicePage.showProjects()"><label class="btn btn-default" ng-class="{ active:' +
      ' servicePage.exploitation == \'false\' }"><input type="checkbox" ng-model="servicePage.exploitation">Показать' +
      ' с проектами</label></div>'
    }
  }

  function ngValueBlank() {
    return {
      restrict: 'A',
      scope: {
        value : '=ngValueBlank'
      },
      template: "<div ng-class=\"{ 'text-danger': !value.toString() }\"> {{ value.toString() || 'Не указано' }} </div>"
    }
  }

  // Для отслеживания изменения параметра input[type='file'] в шапке.
  function fileServiceEvent() {
    return {
      restrict: 'A',
      scope: {
        fileServiceEvent: '&',
        fileServiceType: '@'
      },
      link: function (scope, element, attrs) {
        element.on('change', function () {
          scope.$apply(function () {
            scope.fileServiceEvent({ type: scope.fileServiceType });
          });
        });
      }
    }
  }

  function addNewService() {
    return {
      restrict: 'C',
      template: '<div><button class="btn btn-primary btn-block dropdown-toggle" name="button" type="button" data-toggle="dropdown">'+
      'Создать <span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-left">'+
      '<li><a href="/services/new?type=false"> Сервер </a></li>'+
      '<li><a href="/services/new?type=true"> Сервис </a></li></ul></div>'
    }
  }

  function addServiceBased() {
    return {
      restrict: 'C',
      template: '<div><button class="btn btn-primary btn-block dropdown-toggle" name="button" type="button" data-toggle="dropdown">'+
      'Создать на основе <span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-left">'+
      '<li><a class="pointer" ng-click="servicePage.addService(false)"> Сервер </a></li>'+
      '<li><a class="pointer" ng-click="servicePage.addService(true)"> Сервис </a></li></ul></div>'
    }
  }

})();