(function () {
  'use strict';

  app
    .controller('ServerTypeIndexCtrl', ServerTypeIndexCtrl)     // Общая таблица типов серверов
    .controller('ServerTypePreviewCtrl', ServerTypePreviewCtrl) // Предпросмотр типа
    .controller('ServerEditTypeCtrl', ServerEditTypeCtrl);      // Форма добавления/редактирования типа

  ServerTypeIndexCtrl.$inject   = ['$controller', '$scope', '$rootScope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error', 'Ability'];
  ServerTypePreviewCtrl.$inject = ['$scope'];
  ServerEditTypeCtrl.$inject    = ['GetDataFromServer'];

// =====================================================================================================================

  /**
   * Управление общей таблицей серверов
   *
   * @class DataCenter.ServerTypeIndexCtrl
   * @param $controller
   * @param $scope
   * @param $rootScope
   * @param $location
   * @param $compile
   * @param DTOptionsBuilder
   * @param DTColumnBuilder
   * @param Server - описание: {@link DataCenter.Server}
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Error - описание: {@link DataCenter.Error}
   * @param Ability - описание: {@link DataCenter.Ability}
   */
  function ServerTypeIndexCtrl($controller, $scope, $rootScope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    // Флаг, скрывающий модальное окно
    self.previewModal   = false;
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('stateSave', true)
      .withOption('ajax', {
        url: '/server_types.json',
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-4"' +
          '<"#server_types.new-record">>' +
        '<"col-sm-8 col-md-8 col-lg-4">' +
        '<"col-sm-2 col-md-2 col-lg-4"f>>' +
      't<"row"' +
        '<"col-md-6"i>' +
        '<"col-md-6"p>>'
    );
    // Объекты серверов (id => data)
    self.serverTypes  = {};
    self.dtColumns    = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Типы оборудования'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-sm-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Приватные функции ===================================================

    /**
     * Показать номер строки.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {*}
     * @private
     */
    function renderIndex(data, type, full, meta) {
      self.serverTypes[data.id] = data;
      return meta.row + 1;
    }

    /**
     * Callback после инициализации таблицы, получения данных (не ajax, т.к. ajax происходит асинхронно) и
     * построения таблицы.
     * 
     * @param settings
     * @param json
     * @private
     */
    function initComplete(settings, json) {
      var api = new $.fn.dataTable.Api(settings);

      Ability.init()
        .then(
          function (data) {
            // Записать в фабрику
            Ability.setRole(data.role);

            // Показать инструкции и иконки урпавления только для определенных ролей
            api.column(2).visible(Ability.canView('admin_tools'));
          },
          function (response, status) {
            Error.response(response, status);

            // Удалить все данные в случае ошибки проверки прав доступа
            api.rows().remove().draw();
          });
    }

    /**
     * Callback после создания каждой строки.
     *
     * @param row
     * @param data
     * @param dataIndex
     * @private
     */
    function createdRow(row, data, dataIndex) {
      // Событие click для просмотра информации об оборудовании
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServerTypeData(data.id));
      });

      // Компиляция строки
      $compile(angular.element(row))($scope);
    }

    /**
     * Показать данные сервера.
     *
     * @param id
     * @private
     */
    function showServerTypeData(id) {
      Server.ServerType.get({ id: id },
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('server_type:show', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    /**
     * Отрендерить ссылку на удаление сервера.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverType.destroyServerType(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    /**
     * Удалить тип сервера.
     *
     * @methodOf DataCenter.ServerTypeIndexCtrl
     * @param num
     * @returns {boolean}
     */
    self.destroyServerType = function (num) {
      var confirm_str = "Вы действительно хотите удалить тип оборудования \"" + self.serverTypes[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.ServerType.delete({ id: num },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);

          // В случае успешного удаления из базы необходимо удалить тип из фильтра в таблице серверов.
          $rootScope.$emit('table:server:filter:server_type:delete', num);
        },
        // Error
        function (response) {
          Error.response(response);
        });
    }
  }

// =====================================================================================================================

  /**
   * Управление предпросмотром типа сервера
   *
   * @class DataCenter.ServerTypePreviewCtrl
   * @param $scope
   */
  function ServerTypePreviewCtrl($scope) {
    var self = this;

    $scope.$on('server_type:show', function (event, data) {
      // Заголовок модального окна
      self.name    = data.name;
      // Состав типа оборудования
      self.details = [];

      $.each(data.template_server_details, function (index, value) {
        self.details.push({
          name:   value.server_part.name,
          type:   value.server_part.detail_type.name,
          count:  value.count
        });
      });
    });
  }

// =====================================================================================================================

  /**
   * Управление формой добавления/редактирования типа сервера
   *
   * @class DataCenter.ServerEditTypeCtrl
   * @param GetDataFromServer - описание: {@link DataCenter.GetDataFromServer}
   */
  function ServerEditTypeCtrl(GetDataFromServer) {
    var self = this;

    // Объект вида { Имя => Кол-во комплектующих }
    self.presenceCount  = {};
    // Индекс последнего элемента формы. Используется для того, чтобы знать, какой индекс указывать для следующего
    // элемента.
    var lastIndex       = 0;

// =============================================== Приватные функции ===================================================

    /**
     * Получить текущее кол-во комплектующих для каждого типа комплектующей
     *
     * @private
     */
    function getDeatilsCount() {
      $.each(self.detailTypes, function (index, value) {
        self.presenceCount[value.name] = 0;

        if (!($.isEmptyObject(self.data)) && self.data[value.name])
          $.each(self.data[value.name], function (index, in_value) {
            if (in_value.destroy == 0 || !in_value.destroy)
              self.presenceCount[value.name] ++;
          });

        if (self.presenceCount[value.name] > lastIndex)
          lastIndex = self.presenceCount[value.name];
      });
    }

// =============================================== Инициализация =======================================================

    /**
     * Инициализация
     *
     * @methodOf DataCenter.ServerEditTypeCtrl
     * @param id
     * @param name
     */
    self.init = function (id, name) {
      GetDataFromServer.ajax('server_types', id, name)
        .then(function (data) {
          // Данные о сервере (состояние, тип, состав)
          self.data         = data.template_server_details || {};
          // Все существующие типы запчастей с самими запчастями
          self.detailTypes  = data.detail_types;

          getDeatilsCount();
        });
    };

// =============================================== Публичные функции ===================================================

    /**
     * Добавить комплектующую
     *
     * @methodOf DataCenter.ServerEditTypeCtrl
     * @param index - индекс типа детали в массиве detailTypes
     * @returns {boolean}
     */
    self.addDetail = function (index) {
      var type = self.detailTypes[index];

      // Выйти, если тип детали не найден.
      if (!type || type.server_parts.length == 0)
        return false;

      lastIndex ++;
      self.presenceCount[type.name] ++;

      // Если массива с данным видом комплектующих не существует, то необходимо его создать
      if (!self.data[type.name])
        self.data[type.name] = [];

      self.data[type.name].push({
        server_part_id: type.server_parts[0],
        server_part:    type.server_parts[0],
        id:             null,
        count:          1,
        destroy:        0,
        index:          lastIndex
      });
    };

    /**
     * Удалить комплектующую
     *
     * @methodOf DataCenter.ServerEditTypeCtrl
     * @param typeName - имя комплектующей
     * @param detail - объект-деталь
     */
    self.delDetail = function (typeName, detail) {
      if (detail.id)
        detail.destroy = 1;
      else {
        self.data[typeName].splice($.inArray(detail, self.data[typeName]), 1);
        if (detail.index == lastIndex)
          lastIndex --;
      }

      self.presenceCount[typeName] --;
    };
  }
})();