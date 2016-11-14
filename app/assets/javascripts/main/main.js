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
    .config(['$resourceProvider', function($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }]);
})();

$(function() {
  'use strict';

  // Настройки DataTable
  $.extend(true, $.fn.DataTable.defaults, {
    dom: '<"row"<"col-sm-12"f>>t<"row"<"col-sm-12"p>>',
    lengthChange: true,
    info:         true,
    stateSave:    true,
    language: { //Надписи на кнопках и в таблице
      emptyTable: 'Данные отсутствуют',
      paginate: { //Нумерация страниц
        first:    'Перв.',
        last:     'Посл.',
        previous: 'Пред.',
        next:     'След.'
      },
      search:             '',
      searchPlaceholder:  'Поиск',
      zeroRecords:        'Данные отсутсвуют',
      lengthMenu:         'Показано _MENU_ записей',
      processing:         'Выполнение...',
      loadingRecords:     'Загрузка данных с сервера...',
      info:               'Записи с _START_ по _END_ из _TOTAL_',
      infoFiltered:       '(выборка из _MAX_ записей)',
      infoEmpty:          '0 записей'
    }
  });

  // Настройки модальных окон
  $('.modal.fade').modal({
    keyboard: true,
    show:     false
  });

});