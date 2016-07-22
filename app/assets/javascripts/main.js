var app = angular.module('servers', []);
app.directive('stopClick', function() {
  return function(scope, element, attrs) {
    element.click(function(event) {
      event.preventDefault();
    })
  }
});

app.controller("FlashMessageCtrl",['$attrs', '$timeout', function($attrs, $timeout) {
  controller = this;

  if ($attrs.notice)
    controller.notice = $attrs.notice;
  if ($attrs.alert)
    controller.alert  = $attrs.alert;

  // controller.notice = $attrs.notice;
  // controller.alert  = $attrs.alert;

  $timeout(function() {
    controller.notice = null;
  }, 2000);

}]);

/* ======================================================================================= */

$(function () {
  var modal = $('modal');

  // Настройки DataTable
  $.extend(true, $.fn.DataTable.defaults, {
    // dom : 'ftrip',
    dom: "<'row'<'#data-table-filter.col-sm-6'><'col-sm-6'f>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    lengthChange: true,
    info: true,
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
