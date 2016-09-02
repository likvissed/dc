app.directive('servForm', ['$http', function ($http) {
  return function (scope, element, attrs) {
    // Новый сервер
    if (attrs.servForm == 0) {
      $http.get('/servers/new.json')
        .success(function (data, status, header, config) {
          scope.statuses  = data.server_statuses;
          scope.types     = data.server_types;
        })
        .error(function (data, status, header, config) {

        })
    }
    //Редактирование существующего сервера
    else {
      $http.get('/servers/' + attrs.servName + '/edit.json')
        .success(function(data, status, header, config) {
          console.log(data);
          scope.server    = data.server;
          scope.statuses  = data.server_statuses;
          scope.types     = data.server_types;
          scope.details   = data.server_details;
          scope.parts     = data.server_parts;
        });
    }
  };
}]);

// Редактирование комплектующих
app.controller('ServEditCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.changeType = function (type) {
    $http.get('/server_types/' + type.name + '/edit.json')
      .success(function(data, status, header, config) {
        $scope.details = data.server_details;
        $.each($scope.details, function () {
          this.id = null; //Сбросить id для комплектующих шаблонного сервера
        });
        $scope.parts = data.server_parts;
      });
  };

  $scope.addServPart = function () {
    $scope.details.push({
      server_part_id: $scope.parts[0].id,
      server_part: $scope.parts[0],
      count: 1,
      destroy: 0
    });
  };

  $scope.delServPart = function (detail) {
    if (detail.id)
      detail.destroy = 1;
    else
      $scope.details.splice($.inArray(detail, $scope.details), 1)
  }
}]);

/* ============================================================================================= */

$(function() {
  var
    modal = $('#modal'),
    table = $('#servTable').DataTable({
      dom: '<"row"<"#add_server_block.col-md-2"><"#filter_type_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>',
      ajax: {
        url:    'servers.json',
        async:  false,
        type:   'get',
        data: function (data) {
          var val = $("#serverTypeFilter").find(":selected").val();
          if (!val)
            data.server_type_val = 0;
          else
            data.server_type_val = val;
        }
      },
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'name'
        },
        {
          data: 'server_type.name'
        },
        {
          data: 'location'
        },
        {
          data:       'del',
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServer();
      },
      initComplete: function (settings, json) {
        // Создать фильтр по типу сервера
        var select = $('<select class="form-control" id="serverTypeFilter">').appendTo('#filter_type_block');

        $('<option>').val('0').text('Все типы').appendTo(select);
        $.each(json.server_types, function(index, value) {
          $('<option>').val(value.id).text(value.name).appendTo(select);
        });

        // Создать кнопку добавления нового сервера
        $('#add_server_form').appendTo('#add_server_block');

        // Изменить класс у формы поиска
        $('.dataTables_filter input').removeClass('input-sm');
      }
    });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    modal.find('table[data-id="details"] tr').not('tr.hidden').remove();
  });

  // Фильтр таблицы
  $('#serverTypeFilter').on('change', function () {
    table.ajax.reload(null, false);
  });

  // Показать информацию о сервере
  function showServer() {
    $('#servTable > tbody > tr').off().on('click', function (event) {
      if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
        return true;

      $.get('servers/' + this.id + '.json', function (data) {
        //var modal = $('#modal');

        // Заполнение поля "Описание"
        modal.find('.modal-header .modal-title').text(data.name + ' (' + data.server_status.name + ')')
          .end().find('td[data-id="srvLocation"]').text(data.location)
          .end().find('td[data-id="srvType"]').text(data.server_type.name)
          .end().find('td[data-id="srvSerial"]').text(data.serial_num)
          .end().find('td[data-id="srvInventory"]').text(data.inventory_num);

        if (data.clusters.length != 0)
          modal.find("td[data-id='srvCluster']").text(data.clusters[0].name);
        else
          modal.find("td[data-id='srvCluster']").text('');

        // Заполнение поля "Состав"
        $.each(data.real_server_details, function (index) {
          modal.find('tr.hidden').clone().appendTo('table[data-id="details"]').removeClass('hidden')
            .find('td:first-child').text(this.server_part.name)
            .end().find('td:last-child').text(this.count);
        });

        // Ссылка на изменение данных о сервере
        modal.find('a[data-id="changeData"]').attr('href', '/servers/' + data.name + '/edit');

        modal.modal('show');
      });
    })
  }
});

