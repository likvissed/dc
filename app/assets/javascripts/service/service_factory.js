app.factory('Service', function ($http, $q) {
  return function (id, name, data) {
    var self = this;

    // =============================================== Приватные методы ================================================

    var
      _visible_network_count  = 2,    // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
      _visible_storage_count  = 2,    // Количество строк "Подключения к СХД", видимых пользователем
      _service_old_data       = data, // Данные, полученные с сервера
      _service_new_data   = {         // Массив новых данных, которые впоследствии уйдут на сервер
        networks:           [],         // Массив подключений к сети
        parents:            [],         // Массив сервисов-родителей
        storages:           [],         // Массив подключений к СХД
        missing_file:       {},         // Объект, содержащий флаги, которые показывают отсутствующие файлы
        network_template:   {}          // Объект, содержащий строки модального окна "Подключения к сети"
      },
      _parent_arr             = [];

    // Получить данные о сервисе
    function _get_old_service_data(name) {
      if (name === undefined)
        return _service_old_data;

      return _service_old_data[name] ? _service_old_data[name] : null
    }

    // Создает строку, которую видит пользователь в поле "Подключение к сети"
    function _setNetworkString(segment, vlan, dns_name) {
      return [segment, vlan, dns_name].join(", ");
    }

    // =============================================== Методы, вызываемые при инициализации ============================

    // Функция, заполняющая данными переменные параметры пункта "Подключения к сети"
    function _checkFirstNetwork(index) {
      var
        name  = '',
        first = false;

      if (index == 0) { // Если первый элемент
        name  = 'Подключение к сети';
        first = true;
      }

      return { name: name, is_first: first};
    }

    // Установить начальное значение для подключений к сети
    function _defaultNetworkParams() {
      return {
        destroy:  0,
        id:       null,
        view:     null,
        hide:     false,
        value:    null,
        ports:    {
          id: null,
          inet_tcp_ports: '',
          inet_udp_ports: '',
          local_id:       0,
          local_tcp_ports: '',
          local_udp_ports: ''
        }
      }
    }

    // Элемент массива подключений к сети
    function _singleNetwork(index, id, destroy, name, first, view, hide, value, ports) {
      return {
        local_id: index,    // Индекс, необходимый для связывания массива networks с массивом открытых портов (template_ports)
        id:       id,       // id в базе данных
        destroy:  destroy,  // Если 1 - удалить из базы
        name:     name,     // Наименование в первом столбце для первой строки
        first:    first,    // Для первого элемента (чтобы знать, писать ли наименование "Подключения к сети")
        view:     view,     // Выводимая на экран строка
        hide:     hide,     // Если true - скрыть от пользователя (при нажатии кнопки "Удалить")
        value:    value,    // Массив объектов, записываемых в базу (Сегмент, VLAN, DNS-имя)
        ports:    ports     // Массив объектов с перечислением открытых портов
      }
    }

    // Функция, создающая массив подключений к сети
    // newNet - флаг (true/false), определяющий, создавать пустые объекты для нового сервиса или добавить существующие данные для редактируемого сервиса
    // data - объект, содержащий данные существующих подключений к сети
    function _generateNetworkArr(newNet, data) {
      var
        obj,
        params = _defaultNetworkParams();

      // Заполнение минимально необходимого количества строк подключений к сети
      for (var index = 0; index < _visible_network_count; index ++) {
        obj = _checkFirstNetwork(index);
        _service_new_data.networks.push(_singleNetwork(index, params.id, params.destroy, obj.name, obj.is_first, params.view, params.hide, params.value, params.ports));
      }

      // Для существующих подключений к сети
      if (!newNet)
        $.each(data, function (index, value) {
          var
            obj             = _checkFirstNetwork(index),
            id              = value.id,
            view            = _setNetworkString(value.segment, value.vlan, value.dns_name),
            ports           = value.service_port;

          ports.local_id  = index;
          _service_new_data.networks[index] = _singleNetwork(index, id, params.destroy, obj.name, obj.is_first, view, params.hide, params.value, params.ports);
        });

      return _service_new_data.networks;
    }

    function _singleNetworkTemplate (segment, vlan, dns_name) {
    //  СЮДА НУЖНО ПЕРЕДАТЬ ИНДЕКС МАССИВА NETWORKS
    }

    function _setNetworkTemplate (data) {
      //if (data === undefined)
      //  _singleNetworkTemplate(segment, vlan, dns_name)
      
    }

    // Элемент массива подключений к СХД
    function _singleStorage(id, destroy, name, value) {
      return {
        id:       id,
        destroy:  destroy,
        name:     name,
        value:    value
      }
    }

    // Функция, заполняющая данными переменные параметры пункта "Подключения к СХД"
    function _checkFirstStorage(index) {
      var name  = '';

      if (index == 0) // Если первый элемент
        name  = 'Подключение к СХД';

      return name;
    }

    // Функция, создающая массив подключений е СХД
    function _generateStorageArr(newStorage, data) {
      var
        //storage = [],   // Возврвщаемый массив
        id      = null, // id в БД
        destroy = 0,    // Флаг удаления записи (0 - не удалять из БД, 1 - удалять)
        name,           // Имя в первом столбце таблицы ("Подключение с СХД" или пустая строк)
        value   = null; // Значение, указываемое в поле "Подключение к СХД"

      for (var index = 0; index < _visible_storage_count; index ++) {
        name = _checkFirstStorage(index);
        _service_new_data.storages.push(_singleStorage(id, destroy, name, value));
      }

      // Для существующеих подключений к СХД
      if (!newStorage)
        $.each(data, function (index, value) {
          id    = value.id;
          name  = _checkFirstStorage(index);

          _service_new_data.storages[index] = _singleStorage(id, destroy, name, value);
        });

      return _service_new_data.storages;
    }

    // Элемент объекта флагов отсутствующих файлов
    function _singleMissingFile(scan, act, instr_rec, instr_off) {
      return {
        scan:       scan,
        act:        act,
        instr_rec:  instr_rec,
        instr_off:  instr_off
      }
    }

    // Функция, создающая массив флагов, определяющих наличие файла, акта, инструкции по восст. и инструкции по откл.
    function _generateMissingFileArr(newMissingFile, data) {
      if (newMissingFile)
        _service_new_data.missing_file = _singleMissingFile(true, true, true, true);
      else
        _service_new_data.missing_file = _singleMissingFile(data.scan, data.act, data.instr_rec, data.instr_off);

      return _service_new_data.missing_file;
    }

    // Функция, создающая массив зависимостей формуляра
    function _generateParentArr(newParent, data) {
      if (!newParent)
        $.each(data, function (index, value) {
          //_parent_arr.push(value);
          //_new_service_arr_data('parents', 'new', )
          _service_new_data.parents.push(value);
        });

      return _service_new_data.parents;
    }

    // =============================================== Методы для работы контроллера ===================================

    function _addParent() {
      // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить случай, когда сервис-родитель = текущему сервису)
      $.each(self.services, function (index, value) {
        if (value.name != self.name) {
          var data = {
            parent_id: value.id,
            parent_service: value,
            destroy: 0
          };
          _service_new_data.parents.push(data);

          return false;
        }
      });
    }

    // =============================================== Публичные методы ================================================

    self.id       = id;       // Id формуляра
    self.name     = name;   // Имя формуляра
    self.services = _get_old_service_data('services'); // Массив со списком существующих сервисов
    //self.parents = [];
    self.visible_count = _visible_network_count;

    // =============================================== Методы, вызываемые при инициализации ============================

    // Получить данные о подключениях к сети
    self.getNetworks = function () {
      if (self.id == 0)
        return _generateNetworkArr(true);

      return _generateNetworkArr(false, _get_old_service_data('service_networks'));
    };

    // Получить данные о подключениях к СХД
    self.getStorages = function () {
      if (self.id == 0)
        return _generateStorageArr(true);

      return _generateStorageArr(false, _get_old_service_data('storage_systems'));
    };

    // Получить данные о загруженых файлах
    self.getMissingFiles = function () {
      if (self.id == 0)
        return _generateMissingFileArr(true);

      return _generateMissingFileArr(false, _get_old_service_data('missing_file'));
    };

    self.getParents = function () {
      if (self.id == 0)
        return _generateParentArr(true);

      return _generateParentArr(false, _get_old_service_data('parents'));
    };

    //Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
    self.set_first_network_element = function () {
      var selected_network = null;

      $.each(_service_new_data.networks, function (index, value) {
        if (value.value != null && value.view != '') {
          selected_network = value;

          return false;
        }
      });

      return selected_network;
    };

    // =============================================== Методы для работы контроллера ===================================

    // Добавить подключение к сети
    self.addNetwork = function () {
      var
        index   = _service_new_data.networks[_service_new_data.networks.length - 1].local_id + 1,
        obj     = _checkFirstNetwork(index),
        params  = _defaultNetworkParams();
        data    = _singleNetwork(index, params.id, params.destroy, obj.name, obj.is_first, params.view, params.hide, params.value, params.ports);

      _service_new_data.networks.push(data);
      //$scope.visible_count ++;
    };

    // Получить объект "Подключения к сети" для модального окна
    self.getNetworkTemplate = function (index) {
      if (_service_new_data.networks[index].value == null)
        _setNetworkTemplate();
      else
        // ОСТАНОВИЛСЯ ЗДЕСЬ. ОСТАВИТЬ ДЕФОЛТНЫЙ NULL
        _setNetworkTemplate(_service_new_data.networks[index].value);

      // Получаем индекс строки, данные о которой необходимо изменить
      //$scope.index = $index;

      // Если в строке не было данных, создать пустой шаблон для заполнения полей окна "Подключения к сети"
      //if ($scope.networks[$index].value == null)
      //  $scope.template_network = {
      //    segment:  '',
      //    vlan:     '',
      //    dns_name: ''
      //  };
      // Если данные уже были, заполнить ими строки
      //else
      //  $scope.template_network = {
      //    segment:  $scope.networks[$index].value.segment,
      //    vlan:     $scope.networks[$index].value.vlan,
      //    dns_name: $scope.networks[$index].value.dns_name
      //  };
      //
      //modal.modal('show');

      // Добавить автофокус на поле "Сегмент сети" после открытия модального окна "Подключения к сети"
      //modal.on('shown.bs.modal', function () {
      //  $("#template_network_segment").focus();
      //})*/
    };

    // Добавить сервис-родитель
    self.addParent = function () {
      // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
      if (self.services.length == 1 && self.id != 0) { // Если формуляр единственный и он редактируется
        alert('Для создания зависимостей необходимо добавить больше сервисов');
        return _parent_arr;
      }

      _addParent();
    };

    // Показать запись "Отсутствуют", если родителей нет
    self.showParents = function () {
      var show = 1;
      $.each(_service_new_data.parents, function (index, value) {
        if (!value.destroy) {
          show = 0;
          return false;
        }
      });

      return show ? true: false
    };

    // Удалить сервис-родитель
    self.delParent = function (parent) {
      var index = $.inArray(parent, _service_new_data.parents);

      if (parent.id) // Для уже существующих родителей
        _service_new_data.parents[index].destroy = 1;
      else // Для только что созданных родителей
        _service_new_data.parents.splice(index, 1);
    };

    // Отключить ссылку, если файл отсутствует
    self.disableLink = function (missing, event) {
      if (missing)
        event.preventDefault();
      else {
        var target = event.target;

        if (target.attributes['data-link-type'].value == 'destroy') {
          var is_destroy = confirm('Вы действительно хотите удалить ' + target.attributes['data-type'].value);

          if (!is_destroy)
            event.preventDefault();
        }
      }
    };

    //self.networkModal = function (flag) {
    //  if (flag === undefined)
    //
    //}

    //self.network =

    // =============================================== Основной поток фабрики ==========================================

    // Запрос на сервер для получения всей необходимой информации о текущем сервисе (в случае редактирования), а так же
    // всех остальных сервисов
    //_initialRequest(self.id, self.name);
    //console.log(_get_old_service_data());
  }
});

// Фабрика для выполнения GET запроса на сервер для получения всей информации о сервисе
// id - id сервиса
// name - имя сервиса
app.factory('GetServiceData', function ($http, $q) {
  return {
    ajax: function (id, name) {
      var deferred = $q.defer(); // создаем экземпляр должника

      if (id == 0)
        $http.get('/services/new.json')
          .success(function (data, status, header, config) {
            deferred.resolve(data);
          });
      else
        $http.get('/services/' + name + '/edit.json')
          .success(function (data, status, header, config) {
            deferred.resolve(data);
            //self.current_name  = data.current_name; // current_name необходим для исключения этого имени из списка родителей-сервисов
          });

      return deferred.promise;
    }
  }
});