(function () {
  'use strict';

  app
    .controller('ServiceIndexCtrl', ServiceIndexCtrl)
    .controller('ServicePreviewCtrl', ServicePreviewCtrl)
    .controller('ServiceEditCtrl', ServiceEditCtrl)
    .controller('ServiceEditNetworkCtrl', ServiceEditNetworkCtrl)
    .controller('ServiceEditPortCtrl', ServiceEditPortCtrl)
    .controller('DependenceCtrl', DependenceCtrl);

  ServiceIndexCtrl.$inject        = ['$controller', '$scope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  ServicePreviewCtrl.$inject      = ['$scope'];
  ServiceEditCtrl.$inject         = ['$scope', 'Service', 'GetDataFromServer'];
  ServiceEditNetworkCtrl.$inject  = ['$scope', 'Service'];
  ServiceEditPortCtrl.$inject     = ['$scope', 'Service'];
  DependenceCtrl.$inject          = ['Service'];

// ================================================ Главная страница сервисов ==========================================

  function ServiceIndexCtrl($controller, $scope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    //$location.absUrl().split('?')[1];

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.options = [
      {
        value:  'all',
        string: 'Все сервисы'
      },
      {
        value:  'crit',
        string: 'Критические задачи'
      },
      {
        value:  '712',
        string: 'Сервисы отдела 712'
      },
      {
        value:  '713',
        string: 'Сервисы отдела 713'
      },
      {
        value:  '***REMOVED***',
        string: 'Сервисы отдела ***REMOVED***'
      },
      {
        value:  '***REMOVED***',
        string: 'Сервисы отдела ***REMOVED***'
      },
      {
        value:  '200',
        string: 'Отделение 200'
      },
      {
        value:  'notUivt',
        string: 'Сервисы других подразделений (не ***REMOVED***)'
      },
      {
        value:  'virt***REMOVED***',
        string: 'Системы производств. виртуализации о.***REMOVED***'
      },
      {
        value:  'virt***REMOVED***',
        string: 'Системы виртуализации о.***REMOVED***'
      },
      {
        value:  'virtNetLan',
        string: 'Система виртуализации ЛВС сетевой службы'
      },
      {
        value:  'virtNetDMZ',
        string: 'Система виртуализации ДМЗ сетевой службы'
      }
    ];
    self.selectedOption = self.options[0];
    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.services       = {};     // Объекты сервисов (id => data)
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', {
        url:  '/services.json',
        data: { filter: self.selectedOption.value }
      })
      .withOption('createdRow', createdRow)
      .withOption('rowCallback', rowCallback)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-1"' +
            '<"#services.new-record">>' +
          '<"col-sm-5 col-md-5 col-lg-7">' +
          '<"col-sm-3 col-sm-3 col-lg-2"' +
            '<"service-filter">>' +
          '<"col-sm-2 col-sm-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-12"p>>'
      );

    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('priority').withTitle('').notSortable(),
      DTColumnBuilder.newColumn('number').withTitle('Номер').withOption('className', 'col-sm-1'),
      DTColumnBuilder.newColumn('name').withTitle('Имя').withOption('className', 'col-sm-4'),
      DTColumnBuilder.newColumn('time_work').withTitle('Режим').withOption('className', 'col-sm-1 text-center'),
      DTColumnBuilder.newColumn('dept').withTitle('Отдел').withOption('className', 'col-sm-1 text-center'),
      DTColumnBuilder.newColumn('contacts').withTitle('Ответственные').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('scan').withTitle('Формуляр').notSortable(),
      DTColumnBuilder.newColumn('act').withTitle('Акт ввода').notSortable(),
      DTColumnBuilder.newColumn('instr_rec').withTitle('Инстр. восст.').notSortable(),
      DTColumnBuilder.newColumn('instr_off').withTitle('Инстр. выкл.').notSortable(),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.services[data.id] = data; // Сохранить данные сервиса (нужны для вывода пользователю информации об удаляемом элементе)
      return meta.row + 1;
    }

    // Компиляция строк
    function createdRow(row, data, dataIndex) {
      $compile(angular.element(row))($scope);
    }

    function rowCallback(row, data, index) {
      // Создание события просмотра данных о формуляре
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServiceData(data));
      });
    }

    // Показать данные сервера
    function showServiceData(row_data) {
      Server.Service.get({id: row_data.id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServicePreviewCtrl
          $scope.$broadcast('serviceData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert();
        });
    }

    // Отрендерить ссылку на удаление сервиса
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="servicePage.destroyService(' + data.id + ')" tooltip-placement="right" uib-tooltip="Удалить сервис"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      self.dtInstance.changeData({
        url:  '/services.json',
        data: { filter: self.selectedOption.value }
      });
    };

    // Удалить сервис
    self.destroyService = function (num) {
      var confirm_str = "Вы действительно хотите удалить формуляр \"" + self.services[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Service.delete({id: num},
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);
        },
        // Error
        function (response) {
          Flash.alert(response.data.full_message);
        });
    }
  }

// ================================================ Режим предпросмотра сервиса ========================================

  function ServicePreviewCtrl($scope) {
    var self = this;

    $scope.$on('serviceData', function (event, data) {
      self.service      = angular.copy(data.service);       // Данные сервиса
      self.missing_file = angular.copy(data.missing_file);  // Флаги, определяющие, имеются ли загруженные файлы
      self.contacts     = angular.copy(data.contacts);      // Ответственные
      self.networks     = [];                               // Подключения к сети
      self.storages     = [];                               // Подключения к СХД

      // Заполнение массива networks
      $.each(data.networks, function (index, value) {
        self.networks[index] = {
          name:   '',
          value:  ''
        };

        if (index == 0)
          self.networks[index].name   = 'Подключения к сети';

        self.networks[index].value  = value;
      });

      // Заполнение массива storages
      $.each(data.storages, function (index, value) {
        self.storages[index] = {
          name:   '',
          value:  ''
        };

        if (index == 0)
          self.storages[index].name   = 'Подключение к СХД';

        self.storages[index].value  = value;
      });
    });
  }

// ================================================ Редактирование сервиса =============================================

  function ServiceEditCtrl($scope, Service, GetDataFromServer) {
    var self = this;

// ================================================ Инициализация ======================================================

    // Для директивы modalShow
    self.flags = Service.getFlags();

    // Инициализация начальных данных
    // id - id формуляра
    // name - имя формуляра
    self.init = function (id, name) {
      GetDataFromServer.ajax('services', id, name)
        .then(function (data) {
          Service.init(id, name, data);

          self.network          = Service.getNetworks();      // Объект, вида { selected: Выбранный объект в модальном окне Порты, values: Массив всех подключений к сети }
          self.missing_file     = Service.getMissingFiles();  // Массив с отстствующими флагами
          self.parents          = Service.getParents();       // Массив с сервисами-родителями
          self.storages         = Service.getStorages();      // Массив с подключениями к СХД
          self.current_name     = name ? name : null;         // Необходим для исключения этого имени из списка родителей-сервисов
          self.services         = Service.getServices();      // Массив всех существующих сервисов для выбора сервисов-родителей.
        })
        .then(function () {
          // Фильтр, определяющий, показывать ли надпись "Отсутствует" в поле родителей-сервисов
          self.showParents = function () {
            return Service.showParents();
          };
        });
    };

// ================================================ "Подключения к сети" ===============================================

    // Открыть модальное окно "Подключение к сети"
    self.showNetworkModal = function ($index) {
      var obj = {
        index: $index, // Запоминаем индекс строки, данные о которой необходимо изменить
        network: Service.getNetworkTemplate($index)
      };

      $scope.$broadcast('serviceNetworkData', obj);
    };

    // Добавить строку "Подключения к сети"
    self.addNetwork = function () {
      Service.addNetwork();
    };

    // Удалить строку "Подключения к сети"
    self.delNetwork = function (network) {
      Service.delNetwork(network);
    };


// ================================================ "Открытые порты" ===================================================

    // Открыть модальное окно "Открытые порты"
    self.showPortsModal = function ($event) {
      var obj = {
        network:  self.network,
        event:    $event,
        ports:    Service.getCurrentPorts()
      };

      $scope.$broadcast('servicePortsData', obj);
    };

// ================================================ Работа с файлами ===================================================

    // Удалить файл
    self.removeFile = function ($event) {
      if (!self.missing_file[$event.target.attributes['data-type'].value])
        Service.removeFile($event);
    };
  }

// ================================================ Модальное окно "Подключение к сети" ================================

  function ServiceEditNetworkCtrl($scope, Service) {
    var self = this;

    var standart = null; // Переменная, содержащая объект "подключение к сети" до внесения в него изменений
    $scope.$on('serviceNetworkData', function (event, data) {
      self.index  = data.index;
      self.value  = data.network;
      standart    = angular.copy(self.value);

      Service.setFlag('networkModal', true);
    });

    // Закрыть модальное окно по нажатии "Отмена"
    self.closeNetworkModal = function () {
      Service.setFlag('networkModal', false);

      // Проверка, были ли изначально данные пустые. Если да, значит объект network был создан непосредственно
      // перед открытием окна. Чтобы пустой объект не появился в поле select (модальное окно "Открытые порты"),
      // необходимо записать null в объект network
      if (standart.segment == '' && standart.vlan == '' && standart.dns_name == '')
        Service.setNetwork(self.index, null); // Записали null
      else
        Service.setNetwork(self.index, standart); // Записали изначальные данные
    };

    // Закрыть модальное окно по нажатии "Готово"
    self.readyNetworkModal = function () {
      Service.setFlag('networkModal', false);
      Service.setNetwork(self.index, self.value); // Записали новые данные
    };
  }

// ================================================ Модальное окно "Открытые порты" ====================================

  function ServiceEditPortCtrl($scope, Service) {
    var self = this;

    // Инициализация
    $scope.$on('servicePortsData', function (event, data) {
      if (data.ports.length != 0) {
        self.template_index = 0;
        self.template_value = angular.copy(data.ports);
        self.network        = data.network;

        Service.setFlag('portModal', true);
      }
      else {
        $(data.event.target).blur();
        alert("Необходимо создать \"Подключение к сети\"");
      }
    });

    // Событие после выбора "Подключения к сети" в модальном окне "Открытые порты"
    self.changeNetwork = function () {
      // Получаем новый индекс массива портов (используется в паршиале _ports в качестве индекса массива template_ports)
      $.each(self.template_value, function (index, value) {
        if (value.local_id == self.network.selected.local_id) {
          self.template_index = index;

          return false;
        }
      });
    };

    self.readyPortsModal = function () {
      Service.setFlag('portModal', false);

      //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
      Service.setPorts(self.template_value);
    };

    self.closePortsModal = function () {
      Service.setFlag('portModal', false);
    };

    // Фильтр для отображения подключений к сети в модальном окне "Открытые порты"
    self.networksFilter = function () {
      return function (network) {
        return network.value != null;
      }
    };
  }

// ================================================ Сервисы-родители ===================================================

  function DependenceCtrl(Service) {

    // Добавить сервис-родитель
    this.addParent = function () {
      Service.addParent();
    };

    // Удалить сервис-родитель
    this.delParent = function (parent) {
      Service.delParent(parent);
    };
  }
})();
