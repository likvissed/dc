app.directive('servTypeForm', ['$http', function($http) {
  return function(scope, element, attrs){
    if (attrs.servTypeForm == 0) {
      console.log("here1");
      $http.get('/server_types/new.json')
        .success(function(data, status, header, config) {
          scope.parts = data;
          scope.details = [{
            server_part_id: scope.parts[0].id,
            server_part: scope.parts[0],
            count: 1
          }];
        });
    }
    else {
      console.log("here2");
      scope.server_type = {
        name: $('#server_type_name').val()
      }
      $http.get('/server_types/' + attrs.servTypeName + '/edit.json')
        .success(function(data, status, headers, config) {
          scope.details = data.server_details;
          scope.parts = data.server_parts;
        });
    }
  }
}]);

app.controller('ServEditTypeCtrl', ['$scope', '$http', function($scope, $http) {
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

$(function () {
  var
    modal = $('#modal'),
    table = $('#servTypeTable').DataTable({
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'name'
        },
        {
          data:       'del',
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      ajax: {
        url:    'server_types.json',
        async:  false,
        type:   'get'
      },
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServerType();
      },
      initComplete: function () {
        // Изменить класс у формы поиска
        $('.dataTables_filter input').removeClass('input-sm');
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

// Показать информацию о типе сервере
function showServerType() {
  $('#servTypeTable > tbody > tr').not('a').off().on('click', function (event) {
    if (event.target.tagName == 'I' )
      return true;

    $.get('server_types/' + this.id + '.json', function(data) {
      console.log(data);
      var modal = $('#modal');

      modal.find('.modal-header .modal-title').text(data.name)
      // Заполнение поля "Состав"
      $.each(data.template_server_details, function (index) {
        modal.find('tr.hidden').clone().appendTo('table[data-id="details"]').removeClass('hidden')
          .find('td:first-child').text(this.server_part.name)
          .end().find('td:last-child').text(this.count);
      });

      // Ссылка на изменение данных о типе сервера
      modal.find('a[data-id="changeData"]').attr('href', '/server_types/' + data.name + '/edit');

      modal.modal('show');
    });
  })
}
