(function() {
  app
    .controller('FlashMessageCtrl', FlashMessageCtrl)           // Связывает переменные уведомлений с фабрикой
    .controller('DefaultDataTableCtrl', DefaultDataTableCtrl)   // Основные настройки таблицы angular-datatable
    .controller('AjaxLoadingCtrl', AjaxLoadingCtrl);            // Связывает переменные индикатора загрузки с фабрикой

  FlashMessageCtrl.$inject      = ['$scope', '$attrs', 'Flash'];
  DefaultDataTableCtrl.$inject  = ['DTDefaultOptions'];
  AjaxLoadingCtrl.$inject       = ['myHttpInterceptor'];

// =====================================================================================================================

  // После того, как страница отрендерится, контроллер запустит Flash уведомления, полученные от сервера
  function FlashMessageCtrl($scope, $attrs, Flash) {
    $scope.flash = Flash.flash;

    if ($attrs.notice)
      Flash.notice($attrs.notice);

    if ($attrs.alert)
      Flash.alert($attrs.alert);

    $scope.disableAlert = function () {
      Flash.alert(null);
    };
  }

// =====================================================================================================================

  function DefaultDataTableCtrl(DTDefaultOptions) {
    DTDefaultOptions
      .setLanguage({
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
      })
      .setDisplayLength(15)
      .setDOM('<"row"<"col-sm-12"f>>t<"row"<"col-sm-12"p>>');
  }

// =====================================================================================================================

  function AjaxLoadingCtrl(myHttpInterceptor) {
    var self = this;

    self.requests = myHttpInterceptor.getRequestsCount; // Число запросов

    // Настройка ajax запросов, посланных с помощью jQuery (например, в datatables).
    $.ajaxSetup({
      beforeSend: function() {
        myHttpInterceptor.incCount();
      },
      complete: function() {
        myHttpInterceptor.decCount();
      }
    });
  }

})();