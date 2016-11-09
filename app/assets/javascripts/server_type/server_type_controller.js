(function () {
  'use strict';

  app
    .controller('ServerTypeIndexCtrl', ServerTypeIndexCtrl)
    .controller('ServerTypePreviewCtrl', ServerTypePreviewCtrl)
    .controller('ServerEditTypeCtrl', ServerEditTypeCtrl);

  ServerTypeIndexCtrl.$inject   = ['$controller', '$scope', '$rootScope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  ServerTypePreviewCtrl.$inject = ['$scope'];
  ServerEditTypeCtrl.$inject    = ['GetDataFromServer'];

// ================================================ Общая таблица типов серверов =======================================

  function ServerTypeIndexCtrl($controller, $scope, $rootScope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', { url: '/server_types.json' })
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
    self.serverTypes  = {}; // Объекты серверов (id => data)
    self.dtColumns    = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Типы оборудования'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-sm-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.serverTypes[data.id] = data;
      return meta.row + 1;
    }

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

    // Показать данные сервера
    function showServerTypeData(id) {
      Server.ServerType.get({id: id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('serverTypeData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        });
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverType.destroyServerType(' + data.id + ')" tooltip-placement="right" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Приватные функции ===================================================

    // Удалить тип сервера
    self.destroyServerType = function (num) {
      var confirm_str = "Вы действительно хотите удалить тип оборудования \"" + self.serverTypes[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.ServerType.delete({id: num},
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);

          // В случае успешного удаления из базы необходимо удалить тип из фильтра в таблице серверов.
          $rootScope.$emit('deletedServerType', num);
        },
        // Error
        function (response) {
          Flash.alert(response.data.full_message);
        });
    }
  }

// ================================================ Режим предпросмотра типа сервера ===================================

  function ServerTypePreviewCtrl($scope) {
    var self = this;

    $scope.$on('serverTypeData', function (event, data) {
      self.name           = data.name;

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

// ================================================ Редактирование типа сервера ========================================

  function ServerEditTypeCtrl(GetDataFromServer) {
    var self = this;

    self.presenceCount  = {}; // Объект вида { Имя => Кол-во комплектующих }
    var lastIndex       = 0;  // Индекс последнего элемента формы. Используется для того, чтобы знать, какой индекс
                              // указывать для следующего элемента.

// =============================================== Приватные функции ===================================================

    // Получить текущее кол-во комплектующих для кжадого типа комплектующей
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

    self.init = function (id, name) {
      GetDataFromServer.ajax('server_types', id, name)
        .then(function (data) {
          self.data         = data.template_server_details || {}; // Данные о сервере (состояние, тип, состав)
          self.detailTypes  = data.detail_types;                  // Все существующие типы запчастей с самими запчастями

          getDeatilsCount();
        });
    };

// =============================================== Публичные функции ===================================================

    // Добавить комплектующую
    // index - индекс типа детали в массиве detailTypes
    self.addDetail = function (index) {
      var type = self.detailTypes[index];

      // Выйти, если тип детали не найден.
      if (!type)
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

    // Удалить комплектующую
    // typeName - имя комплектующей
    // detail - объект-деталь
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