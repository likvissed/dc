(function () {
  'use strict';

  app
    .controller('ServiceIndexCtrl', ServiceIndexCtrl)
    .controller('ServicePreviewCtrl', ServicePreviewCtrl)
    .controller('ServiceEditCtrl', ServiceEditCtrl)
    .controller('ServiceEditNetworkCtrl', ServiceEditNetworkCtrl)
    .controller('ServiceEditPortCtrl', ServiceEditPortCtrl)
    .controller('DependenceCtrl', DependenceCtrl);

  ServiceIndexCtrl.$inject        = ['$controller', '$scope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'ServiceCookies'];
  ServicePreviewCtrl.$inject      = ['$scope'];
  ServiceEditCtrl.$inject         = ['$scope', 'Service', 'GetDataFromServer'];
  ServiceEditNetworkCtrl.$inject  = ['$scope', 'Service'];
  ServiceEditPortCtrl.$inject     = ['$scope', 'Service'];
  DependenceCtrl.$inject          = ['Service'];

// ================================================ Главная страница сервисов ==========================================

  function ServiceIndexCtrl($controller, $scope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, ServiceCookies) {
    var self = this;

// =============================================== Инициализация =======================================================

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
    self.exploitation   = ServiceCookies.get('showOnlyExploitationServices'); // Установить флаг, скрывающий сервисы, которые не введены в эксплуатацию
    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.services       = {};     // Объекты сервисов (id => data)
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', {
        url:  '/services.json',
        data: {
          filter:       self.selectedOption.value,
          exploitation: self.exploitation
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('rowCallback', rowCallback)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-1"' +
            '<"#services.new-record">>' +
          '<"col-sm-2 col-md-2 col-lg-5">' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"service-exploitation">>' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"service-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-6"i>' +
          '<"col-md-6"p>>'
      );

    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('flags').withTitle('Флаг').withOption('className', 'text-center').notSortable().renderWith(priority),
      DTColumnBuilder.newColumn('number').withTitle('Номер').withOption('className', 'col-md-1'),
      DTColumnBuilder.newColumn('name').withTitle('Имя').withOption('className', 'col-md-4'),
      DTColumnBuilder.newColumn('time_work').withTitle('Режим').withOption('className', 'col-md-1 text-center'),
      DTColumnBuilder.newColumn('dept').withTitle('Отдел').withOption('className', 'col-md-1 text-center'),
      DTColumnBuilder.newColumn('contacts').withTitle('Ответственные').withOption('className', 'col-md-2'),
      DTColumnBuilder.newColumn('scan').withTitle('Формуляр').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('act').withTitle('Акт').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('instr_rec').withTitle('Инстр. восст.').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('instr_off').withTitle('Инстр. выкл.').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Сразу же включить режим предпросмотра ===============================

    var params = $location.absUrl().match(/services\?id=(\d+)/);
    if (params)
      showServiceData(params[1]);

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

        $scope.$apply(showServiceData(data.id));
      });
    }

    // Показать данные сервера
    function showServiceData(id) {
      Server.Service.get({id: id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServicePreviewCtrl
          $scope.$broadcast('serviceData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        });
    }

    // Отрендерить ссылку на удаление сервиса
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="servicePage.destroyService(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить сервис"><i class="fa fa-trash-o fa-1g"></a>';
    }

    function newQuery() {
      self.dtInstance.changeData({
        url:  '/services.json',
        data: {
          filter:       self.selectedOption.value,
          exploitation: self.exploitation
        }
      });
    }

    // Установить флаг для сервиса
    function priority(flag) {
      var str; // Возвращаемая строка

      if (flag.exploitation)
        switch (flag.priority) {
          case 'Критическая производственная задача':
            str = '<i class="fa fa-star" tooltip-placement="top" uib-tooltip="Критическая производственная задача"></i>';
            break;
          case 'Вторичная производственная задача':
            str = '<i class="fa fa-star-half-o" tooltip-placement="top" uib-tooltip="Вторичная производственная задача"></i>';
            break;
          case 'Тестирование и отладка':
            str = '<i class="fa fa-star-o" tooltip-placement="top" uib-tooltip="Тестирование и отладка"></i>';
            break;
          default:
            str = '<i class="fa fa-question" tooltip-placement="top" uib-tooltip="Приоритет функционирования не определен"></i>';
            break;
        }
      else
        str = '<i class="fa fa-cogs" tooltip-placement="top" uib-tooltip="Сервис не в эксплуатации"></i>';

      if (flag.deadline)
        str = '</i><i class="fa fa-exclamation-triangle" tooltip-placement="top" uib-tooltip="Срок тестирования сервиса окончен"></i>';

      return str;
    }

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      newQuery();
    };

    // Выполнить запрос на сервер с учетом необходимости показать/скрыть сервисы, которые не введены в эксплуатацию
    self.showProjects = function () {
      self.exploitation = self.exploitation == 'true' ? 'false' : 'true';
      ServiceCookies.set('showOnlyExploitationServices', self.exploitation);

      newQuery();
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
      self.deadline     = angular.copy(data.deadline);      // Дедлайн для тестового сервиса
      self.missing_file = angular.copy(data.missing_file);  // Флаги, определяющие, имеются ли загруженные файлы
      self.contacts     = angular.copy(data.contacts);      // Ответственные
      self.ports        = angular.copy(data.ports);         // Список открытых портов
      self.networks     = [];                               // Подключения к сети
      self.storages     = [];                               // Подключения к СХД
      self.flag         = {                                 // Установка флага взависимости от того, введен ли сервис в эксплуатацию и приоритета функционирования
        icon: '',
        text: ''
      };

      if (self.service.exploitation) {
        self.flag.icon = 'fa-toggle-on text-success';
        self.flag.text = 'Сервис введен в эксплуатацию';
      }
      else {
        self.flag.icon = 'fa-toggle-off text-muted';
        self.flag.text = 'Сервис не введен в эксплуатацию';
      }

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
          self.storages[index].name = 'Подключение к СХД';

        self.storages[index].value = value;
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

          self.priority         = Service.getPriorities();    // Объект вида { selected: Выбранный объект в поле select "Приоритет функционирования", values: Массив всех видов приоритетов }
          self.network          = Service.getNetworks();      // Объект вида { selected: Выбранный объект в модальном окне Порты, values: Массив всех подключений к сети }
          self.ports            = Service.getPorts();         // Объект вида { local: Имя + Список портов, доступных в ЛС, inet: Имя +ы Список портов, доступных из Интернет }
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

// ================================================ "Срок тестирования"  ===============================================

    self.deadline = {
      openDatePicker: false, // Переменная определяющая начальное состояние календаря (false - скрыть, true - показать)
      format:         'dd-MMMM-yyyy' // Формат времени, который видит пользователь
    };

    // Показать календарь
    self.openDatePicker = function() {
      self.deadline.openDatePicker = true;
    };

    // Дополнительные параметры
    self.dateOptions = {
      //formatDayTitle: 'MMM yyyy',
      minDate:    new Date(),
      showWeeks:  false,
      locale:     'ru'
    };

// ================================================ "Подключения к сети" ===============================================

    // Открыть модальное окно "Подключение к сети"
    self.showNetworkModal = function ($index) {
      var obj = {
        index:    $index, // Запоминаем индекс строки, данные о которой необходимо изменить
        network:  Service.getNetworkTemplate($index)
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
      self.index  = data.index;               // Индекс в массиве
      self.value  = data.network;             // Объект, содержащий значения полей
      standart    = angular.copy(self.value); // Данные на момент открытия модального окна

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
      // Для новых данных
      if (standart.segment == '' && standart.vlan == '' && standart.dns_name == '')
        Service.setNetwork(self.index, self.value, 'new'); // Записали новые данные
      else
        Service.setNetwork(self.index, self.value); // Записали новые данные

      Service.setFlag('networkModal', false);
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

    // Закрыть модальное окно по кнопке "Готово"
    self.readyPortsModal = function () {
      Service.setFlag('portModal', false);

      //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
      Service.setPorts(self.template_value);
    };

    // Закрыть модальное окно по кнопке "Отмена"
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
