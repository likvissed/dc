app.factory('Service', function () {

  var
    _visible_network_count = 2, // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
    _visible_storage_count = 2; // Количество строк "Подключения к СХД", видимых пользователем


  // Создает строку, которую видит пользователь в поле "Подключение к сети"
  var _setNetworkString = function(segment, vlan, dns_name) {
    return [segment, vlan, dns_name].join(", ");
  };

  // Функция, выставляющая переменные параметры для пункта "Подключения к сети"
  var _checkFirstNetwork = function (index) {
    var
      name  = '',
      first = false;

    if (index == 0) { // Если первый элемент
      name  = 'Подключение к сети';
      first = true;
    }

    return { name: name, is_first: first};
  };

  var _checkFirstStorage = function (index) {
    var name  = '';

    if (index == 0) // Если первый элемент
      name  = 'Подключение к СХД';

    return name;
  };

  // Элемент массива подключений к сети
  var _singleNetwork = function (index, id, destroy, name, first, view, hide, value, ports) {
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
  };

  // Элемент массива подключений к СХД
  var _singleStorage = function (id, destroy, name, value) {
    return {
      id:       id,
      destroy:  destroy,
      name:     name,
      value:    value
    }
  };

  // Функция, создающая массив подключений к сети
  // newNet - флаг (true/false), определяющий, создавать пустые объекты для нового сервиса или добавить существующие данные для редактируемого сервиса
  // data - объект, содержащий данные существующих подключений к сети
  var _generateNetworkArr = function (newNet, data) {
    var
      network = [],     // Возвращаемый массив
      //name,             // Имя подключения к сети
      obj,
      destroy = 0,
      id      = null,
      view    = null,
      hide    = false,
      value   = null,
      ports   = null;

    // Заполнение минимально необходимого количества строк подключений к сети
    for (var index = 0; index < _visible_network_count; index ++) {
      obj = _checkFirstNetwork(index);
      network.push(_singleNetwork(index, id, destroy, obj.name, obj.first, view, hide, value, ports));
    }

    // Для существующего сервиса
    if (!newNet) {
      $.each(data, function (index, value) {
        obj             = _checkFirstNetwork(index);
        id              = value.id;
        view            = _setNetworkString(value.segment, value.vlan, value.dns_name);
        ports           = value.service_port;
        ports.local_id  = index;

        network[index] = _singleNetwork(index, id, destroy, obj.name, obj.first, view, hide, value, ports);
      });
    }

    return network;
  };

  // Функция, создающая массив подключений е СХД
  var _generateStorageArr = function (newStorage, data) {
    var
      storage = [],
      id      = null,
      destroy = 0,
      name,
      value   = null;

    for (var index = 0; index < _visible_storage_count; index ++) {
      name = _checkFirstStorage(index);
      storage.push(_singleStorage(id, destroy, name, value));
    }

    if (!newStorage) {
      $.each(data, function (index, value) {
        id    = value.id;
        name  = _checkFirstStorage(index);

        storage[index] = _singleStorage(id, destroy, name, value);
      });
    }

    return storage;
  };

  return {
    visible_count:  _visible_network_count,
    missing_file: { // Массив с флагами, определяющими наличие файлов
      scan:       true,
      act:        true,
      instr_rec:  true,
      instr_off:  true
    },
    parents: [],
    setNetworks: function (data) { //Функция, создающая массив с подключениями к сети и заполняющая его данными
      if (data === undefined)
        return _generateNetworkArr(true);

      return _generateNetworkArr(false, data);
    },
    setStorages: function (data) {
      if (data === undefined)
        return _generateStorageArr(true);

      return _generateStorageArr(false, data);
    },
    addParent: function () {

    }
  };
});


app.factory('Test', function ($http, $q) {
  return function (id, name, data) {
    var self = this;

    // =============================================== Приватные методы ================================================

    var
      _visible_network_count  = 2, // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
      _visible_storage_count  = 2, // Количество строк "Подключения к СХД", видимых пользователем
      _service_data           = data,
      _parent_arr             = [];

    // Получить данные о сервисе
    function _get_service_data(param) {
      if (param === undefined)
        return _service_data;

      return _service_data[param] ? _service_data[param] : null
    }

    // Создает строку, которую видит пользователь в поле "Подключение к сети"
    function _setNetworkString(segment, vlan, dns_name) {
      return [segment, vlan, dns_name].join(", ");
    }

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

    // Функция, заполняющая данными переменные параметры пункта "Подключения к СХД"
    function _checkFirstStorage(index) {
      var name  = '';

      if (index == 0) // Если первый элемент
        name  = 'Подключение к СХД';

      return name;
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

    // Элемент массива подключений к СХД
    function _singleStorage(id, destroy, name, value) {
      return {
        id:       id,
        destroy:  destroy,
        name:     name,
        value:    value
      }
    }

    function _singleMissingFile(scan, act, instr_rec, instr_off) {
      return {
        scan:       scan,
        act:        act,
        instr_rec:  instr_rec,
        instr_off:  instr_off
      }
    }

    // Функция, создающая массив подключений к сети
    // newNet - флаг (true/false), определяющий, создавать пустые объекты для нового сервиса или добавить существующие данные для редактируемого сервиса
    // data - объект, содержащий данные существующих подключений к сети
    function _generateNetworkArr(newNet, data) {
      var
        network = [],     // Возвращаемый массив
      //name,             // Имя подключения к сети
        obj,
        destroy = 0,
        id      = null,
        view    = null,
        hide    = false,
        value   = null,
        ports   = null;

      // Заполнение минимально необходимого количества строк подключений к сети
      for (var index = 0; index < _visible_network_count; index ++) {
        obj = _checkFirstNetwork(index);
        network.push(_singleNetwork(index, id, destroy, obj.name, obj.first, view, hide, value, ports));
      }

      // Для существующих подключений к сети
      if (!newNet)
        $.each(data, function (index, value) {
          obj             = _checkFirstNetwork(index);
          id              = value.id;
          view            = _setNetworkString(value.segment, value.vlan, value.dns_name);
          ports           = value.service_port;
          ports.local_id  = index;

          network[index] = _singleNetwork(index, id, destroy, obj.name, obj.first, view, hide, value, ports);
        });

      return network;
    }

    // Функция, создающая массив подключений е СХД
    function _generateStorageArr(newStorage, data) {
      var
        storage = [],   // Возврвщаемый массив
        id      = null, // id в БД
        destroy = 0,    // Флаг удаления записи (0 - не удалять из БД, 1 - удалять)
        name,           // Имя в первом столбце таблицы ("Подключение с СХД" или пустая строк)
        value   = null; // Значение, указываемое в поле "Подключение к СХД"

      for (var index = 0; index < _visible_storage_count; index ++) {
        name = _checkFirstStorage(index);
        storage.push(_singleStorage(id, destroy, name, value));
      }

      // Для существующеих подключений к СХД
      if (!newStorage)
        $.each(data, function (index, value) {
          id    = value.id;
          name  = _checkFirstStorage(index);

          storage[index] = _singleStorage(id, destroy, name, value);
        });

      return storage;
    }

    // Функция, создающая массив флагов, определяющих наличие файла, акта, инструкции по восст. и инструкции по откл.
    function _generateMissigFileArr(newMissingFile, data) {
      if (newMissingFile)
        return _singleMissingFile(true, true, true, true);

      return _singleMissingFile(data.scan, data.act, data.instr_rec, data.instr_off);
    }

    // Функция, создающая массив зависимостей формуляра
    function _generateParentArr(newParent, data) {
      if (!newParent)
        $.each(data, function (index, value) {
          _parent_arr.push(value);
        });


      return _parent_arr;
    }

    function _addParent() {
      // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить случай, когда сервис-родитель = текущему сервису)
      $.each(self.services, function (index, value) {
        if (value.name != self.name) {
          var data = {
            parent_id: value.id,
            parent_service: value,
            destroy: 0
          };
          _parent_arr.push(data);

          return false;
        }
      });

      return _parent_arr;
    }

    // =============================================== Публичные методы ================================================

    self.id = id;       // Id формуляра
    self.name = name;   // Имя формуляра
    self.services = _get_service_data('services'); // Массив со списком существующих сервисов
    //self.parents = [];
    self.visible_count = _visible_network_count;

    // Получить данные о подключениях к сети
    self.getNetworks = function () {
      if (self.id == 0)
        return _generateNetworkArr(true);

      return _generateNetworkArr(false, _get_service_data('service_networks'));
    };

    // Получить данные о подключениях к СХД
    self.getStorages = function () {
      if (self.id == 0)
        return _generateStorageArr(true);

      return _generateStorageArr(false, _get_service_data('storage_systems'));
    };

    // Получить данные о загруженых файлах
    self.getMissingFiles = function () {
      if (self.id == 0)
        return _generateMissigFileArr(true);

      return _generateMissigFileArr(false, _get_service_data('missing_file'));
    };

    self.getParents = function () {
      if (self.id == 0)
        return _generateParentArr(true);

      return _generateParentArr(false, _get_service_data('parents'));
    };

    // Добавить сервис-родитель
    self.addParent = function () {
      //console.log(_get_service_data('services'));

      // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
      if (self.services.length == 1 && self.id != 0) { // Если формуляр единственный и он редактируется
        alert('Для создания зависимостей необходимо добавить больше сервисов');
        return _parent_arr;
      }

      return _addParent();

/*
      // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить случай, когда сервис-родитель = текущему сервису)
      $.each(self.services, function (index, value) {
        if (value.name != self.name) {
          self.parents.push({
            //parent_id: self.services[index].id,
            parent_service: self.services[index], // Используется в качестве модели для директивы ng-options
            destroy: 0
          });

          return false;
        }
      });
*/
    };

    // =============================================== Основной поток фабрики ==========================================

    // Запрос на сервер для получения всей необходимой информации о текущем сервисе (в случае редактирования), а так же
    // всех остальных сервисов
    //_initialRequest(self.id, self.name);

    //console.log(_get_service_data());
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
            console.log(data);
            deferred.resolve(data);
            //self.current_name  = data.current_name; // current_name необходим для исключения этого имени из списка родителей-сервисов
          });

      return deferred.promise;
    }
  }
});