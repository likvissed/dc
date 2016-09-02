$(function() {
  var
    modal = $('#modal'),
    table = $('#servPartTable').DataTable({
      dom: '<"row"<"#add_server_part_block.col-md-2"><"#filter_type_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>',
      ajax: {
        url:    'server_parts.json',
        async:  false,
        type:   'get',
        data: function (data) {
          var val = $("#detailTypeFilter").find(":selected").val();
          if (!val)
            data.detail_type_val = 0;
          else
            data.detail_type_val = val;
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
          data: 'detail_type.name'
        },
        {
          data: 'part_num'
        },
        {
          data:       'del',
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      createdRow: function (row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServerPart();
      },
      initComplete: function (settings, json) {
        // Создать фильтр по типу деталей
        var select = $('<select class="form-control" id="detailTypeFilter">').appendTo('#filter_type_block');

        $('<option>').val('0').text('Все типы').appendTo(select);
        $.each(json.detail_types, function(index, value) {
          $('<option>').val(value.id).text(value.name).appendTo(select);
        });

        // Создать кнопку добавления нового сервера
        $('#add_server_part_form').appendTo('#add_server_part_block');

        // Изменить класс у формы поиска
        $('.dataTables_filter input').removeClass('input-sm');
      }
    });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    modal.find('div[data-id="srvPartComment"]').text('Отсутствует');
  });

  // Фильтр таблицы
  $('#detailTypeFilter').on('change', function () {
    table.ajax.reload(null, false);
  });
});

// Показать информацию о сервере
function showServerPart() {
  $('#servPartTable > tbody > tr').not('a').off().on('click', function (event) {
    if (event.target.tagName == 'I' )
      return true;

    $.get('server_parts/' + this.id + '.json', function(data) {
      var modal = $('#modal');

      // Заполнение поля "Описание"
      modal.find('.modal-header .modal-title').text(data.name)
        .end().find('td[data-id="srvPartType"]').text(data.detail_type.name)
        .end().find('td[data-id="srvPartNum"]').text(data.part_num);

      if (data.comment)
        modal.find('div[data-id="srvPartComment"]').text(data.comment);

      // Ссылка на изменение данных о сервере
      modal.find('a[data-id="changeData"]').attr('href', '/server_parts/' + data.name + '/edit');

      modal.modal('show');
    });
  })
}