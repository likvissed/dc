app.directive('serviceForm', ['$http', 'Service', function ($http, Service) {
  return function(scope, element, attrs) {
    scope.visible_count = Service.visible_count;  // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
    scope.networks      = Service.set_networks(); // Массив с подключениями к сети
    scope.storages      = Service.storages;       // Массив с подключениями к СХД
    scope.missing_file  = Service.missing_file;   // Массив с флагами, определяющими наличие файлов
    scope.parents       = Service.parents;        // Массив с сервисами-родителями

    /*scope.visible_count = 2; // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
    scope.networks      = [ // Массив с подключениями к сети
      {
        local_id: 0,
        id:       null,
        destroy:  0,
        name:     'Подключение к сети',
        first:    true,
        view:     '',
        hide:     false,
        value:    null,
        ports:    null
      },
      {
        local_id: 1,
        id:       null,
        destroy:  0,
        name:     '',
        first:    false,
        view:     '',
        hide:     false,
        value:    null,
        ports:    null
      }
    ];
    scope.storages = [ // Массив с подключениями к СХД
      {
        destroy:  0,
        name:     'Подключение к СХД',
        value:    null
      },
      {
        destroy:  0,
        name:     '',
        value:    null
      }
    ];
    scope.missing_file = { // Массив с флагами, определяющими наличие файлов
      scan:       true,
      act:        true,
      instr_rec:  true,
      instr_off:  true
    };*/
    //scope.parents = []; // Массив с сервисами-родителями
    scope.serviceForm = attrs.serviceForm; // Переменная, хранящее id сервиса (если существует) или 0 (если нет)
    scope.current_name = null; // current_name необходим для исключения этого имени из списка родителей-сервисов

    //  Редактирование существующего сервиса
    if (attrs.serviceForm == 0) {
      $http.get('/services/new.json')
        .success(function (data, status, header, config) {
          scope.services    = data.services;
        });
    }
    else {
      $http.get('/services/' + attrs.serviceName + '/edit.json')
        .success(function (data, status, header, config) {
          // Массив со списком существующих сервисов
          scope.services = data.services;

          //Массив со списком родительских сервисов (от которых зависит текщий сервис)
          scope.parents = data.parents;

          // current_name необходим для исключения этого имени из списка родителей-сервисов
          scope.current_name = data.current_name;

          // Заполнение массива файлов скана, акта, инструкций (если файл отсутствует => true)
          scope.missing_file = data.missing_file;

          // Настройка полей подключений к сети
          // Для существующего сервиса либо получить количество подключений к сети (если их больше 2), либо установить равным 2
          if (data.service_networks.length > 2)
            scope.visible_count = data.service_networks.length;

          test = Service.set_networks(data.service_networks);
          $.each(data.service_networks, function (index, value) {

            scope.networks[index] = {
              local_id: index,    // Индекс, необходимый для связывания массива networks с массивом открытых портов (template_ports)
              id:       null,     // id в базе данных
              destroy:  0,        // Если 1 - удалить из базы
              name:     '',       // Наименование в первом столбце для первой строки
              first:    false,    // Для первого элемента (чтобы знать, писать ли наименование "Подключения к сети")
              view:     null,     // Выводимая на экран строка
              hide:     false,    // Если true - скрыть от пользователя (при нажатии кнопки "Удалить")
              value:    null,     // Массив объектов, записываемых в базу (Сегмент, VLAN, DNS-имя)
              ports:    null      // Массив объектов с перечислением открытых портов
            };

            // Заполнение данных в массив из базы
            // Для первого элемента добавить запись 'Подключение к сети'
            if (index == 0) {
              scope.networks[index].name  = 'Подключение к сети';
              scope.networks[index].first = true;
              scope.selected_network = scope.networks[0]; // Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
            }
            else
              scope.networks[index].name = null;

            scope.networks[index].id              = value.id;
            scope.networks[index].value           = value;
            scope.networks[index].view            = [value.segment, value.vlan, value.dns_name].join(", ");
            scope.networks[index].ports           = value.service_port;
            scope.networks[index].ports.local_id  = index;

            // Удалить id из внутреннего массива
            delete scope.networks[index].value.id;
          });

          console.log(scope.networks);
          console.log(test);
          //Настройка полей подключений к СХД
          $.each(data.storage_systems, function (index, value) {
            scope.storages[index].id    = value.id;
            scope.storages[index].value = value;
          });
        });
    }
  }
}]);
