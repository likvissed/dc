app.directive('servForm', function($http) {
  return function(scope, element, attrs){
    // Новый сервер
    if (attrs.servForm == 0) {
      $http.get('/servers/new.json')
        .success(function(data, status, header, config) {
          scope.types = data;
        })
        .error(function(data, status, header, config) {})
    }
    //Редактирование существующего сервера
    else {
      $http.get('/servers/' + attrs.servName + '/edit.json')
        .success(function(data, status, header, config) {
          scope.server  = data.server;
          scope.types   = data.server_types;
          scope.details = data.server_details;
          scope.parts   = data.server_parts;
        });
    }
  };
});

app.controller('ServEditCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.changeType = function(type) {
    $http.get('/server_types/' + type.name + '/edit.json')
      .success(function(data, status, header, config) {
        $scope.details = data.server_details;
        $.each($scope.details, function() {
          this.id = null; //Сбросить id для комплектующих шаблонного сервера
        });
        $scope.parts = data.server_parts;
      });
  }

  $scope.addServPart = function() {
    $scope.details.push({
      server_part_id: $scope.parts[0].id,
      server_part: $scope.parts[0],
      count: 1,
      destroy: 0
    });
  }

  $scope.delServPart = function(detail) {
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
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'name'
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
      ajax: {
        url:    'servers.json',
        async:  false,
        type:   'get'
      },
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServer();
      }
    });

  // Закрыть модальное окно
  modal.find('button[data-id="closeModal"]').on('click', function () {
    modal.modal('hide');
  });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    modal.find('table[data-id="details"] tr').not('tr.hidden').remove();
  });
});

// Показать информацию о сервере
function showServer() {
  $('#servTable > tbody > tr').not('a').off().on('click', function (event) {
    if (event.target.tagName == 'I' )
      return true;

    $.get('servers/' + this.id + '.json', function(data) {
      var modal = $('#modal');

      // Заполнение поля "Описание"
      modal.find('.modal-header .modal-title').text(data.name)
        .end().find('td[data-id="srvLocation"]').text(data.location)
        .end().find('td[data-id="srvType"]').text(data.server_type.name)
        .end().find('td[data-id="srvSerial"]').text(data.serial_num)
        .end().find('td[data-id="srvInventory"]').text(data.inventory_num);

      if (data.cluster)
        modal.find("td[data-id='srvCluster']").text(data.cluster.name);
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


