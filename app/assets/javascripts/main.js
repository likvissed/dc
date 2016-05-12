var app = angular.module('servers', []);
app.directive('stopClick', function() {
  return function(scope, element, attrs) {
    element.click(function(event) {
      event.preventDefault();
    })
  }
});

app.controller("FlashMessageCtrl",['$attrs', '$timeout', function($attrs, $timeout) {
  controller         = this;
  controller.success = $attrs.success;
  controller.error   = $attrs.error;

  $timeout(function() {
    controller.success = null;
    controller.error   = null;
  }, 2000);

}]);

/* ======================================================================================= */

$(function () {
  // Настройки DataTable
  $.extend(true, $.fn.DataTable.defaults, {
    info: false,
    stateSave: true,
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
      loadingRecords:     'Загрузка данных с сервера...'
    }
  });

  // Настройки модальных окон
  $('.modal.fade').modal({
    keyboard: true,
    show:     false
  });
});
