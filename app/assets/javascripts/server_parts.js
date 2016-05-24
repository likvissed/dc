$(function() {
  var
    modal = $('#modal'),
    table = $('#servPartTable').DataTable({
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'detail_type.name'
        },
        {
          data: 'name'
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
      ajax: {
        url:    'server_parts.json',
        async:  false,
        type:   'get'
      },
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServerPart();
      },
    });

  // Закрыть модальное окно
  modal.find('button[data-id="closeModal"]').on('click', function () {
    modal.modal('hide');
  });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    modal.find('div[data-id="srvPartComment"]').text('Отсутствует');
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
