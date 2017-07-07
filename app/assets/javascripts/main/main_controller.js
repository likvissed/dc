(function() {
  app
    .controller('FlashMessageCtrl', FlashMessageCtrl)           // Связывает переменные уведомлений с фабрикой
    .controller('DefaultDataTableCtrl', DefaultDataTableCtrl)   // Основные настройки таблицы angular-datatable
    .controller('AjaxLoadingCtrl', AjaxLoadingCtrl);            // Связывает переменные индикатора загрузки с фабрикой

  FlashMessageCtrl.$inject      = ['$scope', '$attrs', 'Flash'];
  DefaultDataTableCtrl.$inject  = ['DTDefaultOptions'];
  AjaxLoadingCtrl.$inject       = ['$scope', 'myHttpInterceptor'];

// =====================================================================================================================

  /**
   * Контроллер для управления уведомлениями. После того, как страница отрендерится, контроллер запустит Flash
   * уведомления, полученные от сервера.
   *
   * @class DataCenter.FlashMessageCtrl
   * @param $scope
   * @param $attrs
   * @param Flash - описание: {@link DataCenter.Flash}
   */
  function FlashMessageCtrl($scope, $attrs, Flash) {
    $scope.flash = Flash.flash;

    if ($attrs.notice)
      Flash.notice($attrs.notice);

    if ($attrs.alert)
      Flash.alert($attrs.alert);

    /**
     * Убрать alert уведомление.
     */
    $scope.disableAlert = function () {
      Flash.alert(null);
    };
  }

// =====================================================================================================================

  /**
   * Контроллер, содержащий основные настройки таблиц angular-datatable.
   *
   * @class DataCenter.DefaultDataTableCtrl
   * @param DTDefaultOptions
   */
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

  /**
   * Контроллер для управления индикатором выполнения ajax запросов.
   *
   * @class DataCenter.AjaxLoadingCtrl
   * @param $scope
   * @param myHttpInterceptor
   */
  function AjaxLoadingCtrl($scope, myHttpInterceptor) {
    var self = this;

    self.requests = myHttpInterceptor.getRequestsCount; // Число запросов

    // Настройка ajax запросов, посланных с помощью jQuery (например, в datatables).
    $.ajaxSetup({
      beforeSend: function () {
        myHttpInterceptor.incCount();
      },
      complete: function () {
        myHttpInterceptor.decCount();

        self.requests = myHttpInterceptor.getRequestsCount;

        $scope.$apply();
      }
    });
  }

})();