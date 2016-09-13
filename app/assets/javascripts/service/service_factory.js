app.factory('Service', function () {

  // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
  var _visible_count   = 2;

  // Создает строку, которую видит пользователь в поле "Подключение к сети"
  var _set_network_string = function(segment, vlan, dns_name) {
    return [segment, vlan, dns_name].join(", ");
  };

  // Элемент массива подключений к сети
  var _single_network = function (index, id, destroy, name, first, view, hide, value, ports) {
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

  // Функция, создающая массив подключений к сети
  // newNet - флаг (true/false), определяющий, создавать пустые объекты для нового сервиса или добавить существующие данные для редактируемого сервиса
  var _generateNetworkArr = function (newNet, data) {
    var
      network = [],     // Возвращаемый массив
      name,             // Имя подключения к сети
      first,            // Флаг, определяющий, первый ли элемент в списке подключений к сети
      destroy = 0,
      id      = null,
      view    = null,
      hide    = false,
      value   = null,
      ports   = null;

    if (newNet) { // Для нового сервиса
      for (var index = 0; index < _visible_count; index ++) {
        name  = '';
        first = false;

        if (index == 0) { // Если первый элемент
          name  = 'Подключение к сети';
          first = true;
        }

        network.push(_single_network(index, id, destroy, name, first, view, hide, value, ports));
      }
    }
    else { // Для существующего сервиса
      $.each(data, function (index, value) {
        name  = '';
        first = false;

        if (index == 0) {
          name  = 'Подключение к сети';
          first = true;
        }
        id    = data.id;
        value = data;
        view  = _set_network_string(data.segment, data.vlan, data.dns_name);
        ports = data.service_port;
        //ports.local_id = index;

        network.push(_single_network(index, id, destroy, name, first, view, hide, value, ports));

        // Удалить id из внутреннего массива
        //delete network.value.id;
      });
    }

    return network;
  };

  return {
    visible_count: _visible_count,
    storages: [ // Массив с подключениями к СХД
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
    ],
    missing_file: { // Массив с флагами, определяющими наличие файлов
      scan:       true,
      act:        true,
      instr_rec:  true,
      instr_off:  true
    },
    parents: [],

    set_networks: function (data) { //Функция, создающая массив с подключениями к сети и заполняющая его данными
      if (data === undefined)
        return _generateNetworkArr(true);

      return _generateNetworkArr(false, data);
    }
  };
});