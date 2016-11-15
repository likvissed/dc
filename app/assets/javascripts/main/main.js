var app = angular
  .module('DataCenter', [
    'ngResource',
    'ngCookies',
    'ngSanitize',
    'ngAnimate',
    'datatables',
    'ui.bootstrap'
  ]);

(function () {

  app
    // Настройка ресурсов
    .config(['$resourceProvider', function($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }])
    // Настройка ajax запросов
    .config(['$httpProvider', function ($httpProvider) {
      $httpProvider.interceptors.push('myHttpInterceptor');
    }]);
})();

$(function() {
  'use strict';
  // Настройки модальных окон
  $('.modal.fade').modal({
    keyboard: true,
    show:     false
  });


});