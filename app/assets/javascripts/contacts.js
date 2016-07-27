app.controller("contactCtrl", ["$scope", function($scope) {
  $scope.manually = ($("#contact_manually").attr("data-manually") == 'true');
}]);

$(function() {
  var
    modal = $('#modal'),
    table = $('#contactTable').DataTable({
      ajax: {
        url:    'contacts.json',
        async:  false,
        type:   'get'
        //data: function (data) {
          //var val = $("#serverTypeFilter").find(":selected").val();
          //if (!val)
          //  data.server_type_val = 0;
          //else
          //  data.server_type_val = val;
        //}
      },
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'info'
        },
        {
          data: 'dept'
        },
        {
          data: 'work_num',
          orderable:  false
        },
        {
          data: 'mobile_num',
          orderable:  false
        },
        {
          data:       'edit',
          orderable:  false,
          searchable: false,
          className:  'text-center'
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
      initComplete: function (settings, json) {
        // Создать фильтр по типу сервера
        //var select = $('<select class="form-control" id="serverTypeFilter">').appendTo('#data-table-filter');

        //$('<option>').val('0').text('Все типы').appendTo(select);
        //$.each(json.server_types, function(index, value) {
        //  $('<option>').val(value.id).text(value.name).appendTo(select);
        //});

        // Изменить класс у формы поиска
        //$('.dataTables_filter input').removeClass('input-sm');
      }
    });

  // Закрыть модальное окно
  modal.find('button[data-id="closeModal"]').on('click', function () {
    modal.modal('hide');
  });

  // Событие после закрытия окна
  //modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    //modal.find('table[data-id="details"] tr').not('tr.hidden').remove();
  //});

  // Фильтр таблицы
  //$('#serverTypeFilter').on('change', function () {
  //  table.ajax.reload(null, false);
  //});
});
