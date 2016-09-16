$(function() {
  'use strict';

  var
    modal = $('#modal'),
    table = $('#serviceTable').DataTable({
      dom: '<"row"<"#add_service_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>t<"row"<"col-sm-12"p>>',
      ajax: {
        url:    'services.json',
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
      columnDefs: [
        {
          targets: [7, 8, 9, 10, 11],
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'priority',
          content: '#'
        },
        {
          data: 'number',
          width: '85px'
        },
        {
          data: 'name',
          width: '393px'
        },
        {
          data: 'time_work',
          width: '57px'
        },
        {
          data: 'dept',
          width: '50px'
        },
        {
          data: 'contacts',
          width: '207px'
        },
        {
          data: 'scan'
        },
        {
          data: 'act'
        },
        {
          data: 'instr_rec'
        },
        {
          data: 'instr_off'
        },
        {
          data: 'del'
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
        //var select = $('<select class="form-control" id="serverTypeFilter">').appendTo('#data-table-filter');

        //$('<option>').val('0').text('Все типы').appendTo(select);
        //$.each(json.server_types, function(index, value) {
        //  $('<option>').val(value.id).text(value.name).appendTo(select);
        //});

        // Создать кнопку добавления нового сервиса
        AddButton('add_service');

        // Изменить класс у формы поиска
        ChangeSearchFilter();
      }
    });

  // Добавить событие для показа информации о формуляре
  table.rows().each(function () {
    this.nodes().to$().attr('ng-click', 'showServiceData()');
  });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    // Удалить созданные строки таблицы
    modal.find('tr.additional-string').remove().find('tr[data-name="network_template"]').attr('data-position', 'last');

    // Очистить текст полей "Подключения к сети"
    modal.find('td[data-name^="network_name"]').each(function () {
      $(this).text('');
    })
  });

  // Фильтр таблицы
  //$('#serverTypeFilter').on('change', function () {
  //  table.ajax.reload(null, false);
  //});

  function showServer() {
    $('#serviceTable > tbody > tr').off().on('click', function (event) {
      var self = this;

      if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
        return true;

      $.get('services/' + self.id + '.json', function (data) {
        var
          service       = data.service,
          missing_file  = data.missing_file,
          contacts      = data.contacts;

        // Заполнение таблицы предпросмотра
        modal.find('.modal-body').find('[data-name="name"]').text(service.name)
          .end().find('[data-name="descr"]').text(service.descr)
          .end().find('[data-name="priority"]').text(service.priority)
          .end().find('[data-name="time_work"]').text(service.time_work)
          .end().find('[data-name="max_time_rec"]').text(service.max_time_rec)
          .end().find('[data-name="contact_1"]').text(contacts.first)
          .end().find('[data-name="contact_2"]').text(contacts.second)
          .end().find('[data-name="environment"]').text(service.environment)
          .end().find('[data-name="os"]').text(service.os)
          .end().find('[data-name="component_key"]').text(service.component_key)
          .end().find('[data-name="kernel_count"]').text(service.kernel_count)
          .end().find('[data-name="frequency"]').text(service.frequency)
          .end().find('[data-name="memory"]').text(service.memory)
          .end().find('[data-name="disk_space"]').text(service.disk_space)
          .end().find('[data-name="hdd_speed"]').text(service.hdd_speed)
          .end().find('[data-name="network_speed"]').text(service.network_speed)
          .end().find('[data-name="additional_require"]').text(service.additional_require)
          .end().find('[data-name="backup_manual"]').text(service.backup_manual)
          .end().find('[data-name="recovery_manual"]').text(service.recovery_manual)
          .end().find('[data-name="value_backup_data"]').text(service.value_backup_data)
          .end().find('[data-name="storage_time"]').text(service.storage_time)
          .end().find('[data-name="store_copies"]').text(service.store_copies)
          .end().find('[data-name="backup_volume"]').text(service.backup_volume)
          .end().find('[data-name="backup_window"]').text(service.backup_window)
          .end().find('[data-name="time_recovery"]').text(service.time_recovery)
          .end().find('[data-name="duplicate_ps"]').text(service.duplicate_ps)
          .end().find('[data-name="raid"]').text(service.raid)
          .end().find('[data-name="bonding"]').text(service.bonding)
          .end().find('[data-name="other"]').text(service.other)
          .end().find('[data-name="resiliency"]').text(service.resiliency)
          .end().find('[data-name="time_after_failure"]').text(service.time_after_failure)
          .end().find('[data-name="disaster_rec"]').text(service.disaster_rec)
          .end().find('[data-name="time_after_disaster"]').text(service.time_after_disaster)
          .end().find('[data-name="antivirus"]').text(service.antivirus)
          .end().find('[data-name="firewall"]').text(service.firewall)
          .end().find('[data-name="uac_app_selinux"]').text(service.uac_app_selinux)
          .end().find('[data-name="szi"]').text(service.szi)
          .end().find('[data-name="internet"]').text(service.internet)
          .end().find('[data-name="type_mon"]').text(service.type_mon)
          .end().find('[data-name="service_mon"]').text(service.service_mon)
          .end().find('[data-name="hardware_mon"]').text(service.hardware_mon)
          .end().find('[data-name="security_mon"]').text(service.security_mon)
          .end().find('[data-name="additional_data"]').text(service.additional_data)
          .end().find('[data-name="comment"]').text(service.comment)
          .end().find('[data-name="name_monitoring"]').text(service.name_monitoring);

        // Заполнение шапки
        if (service.number)
          modal.find('.modal-title').text('Формуляр № ***REMOVED***-Ф-' + service.number);
        else
          modal.find('.modal-title').text('Номер формуляра отсутствует');

        // Заполнение полей "Подключение к СХД"
        if (service.storage_systems[0])
          modal.find('[data-name="storage_name[0]"]').text(service.storage_systems[0].name);

        if (service.storage_systems[1])
          modal.find('[data-name="storage_name[1]"]').text(service.storage_systems[1].name);

        // Заполнение полей "Подключения к сети"
        $.each(service.service_networks, function (index, value) {
          var text = [value.segment, value.vlan, value.dns_name].join(', ');

          // Если строк > 2, то для каждой дополнительной строки копировать шаблон
          if (index >= 2) {
            modal.find('tr[data-name="network_template"]').clone().insertAfter('tr[data-position="last"]')
              .addClass('additional-string').attr('data-position', 'last').removeClass('hide').removeAttr('data-name').find("td:nth-child(2)").text(text)
              .end().end().prev().removeAttr('data-position');
          }
          else
            modal.find('td[data-name="network_name[' + index + ']"]').html(text);
        });

        // Удаление/Установка ссылок на кнопки скачивания файлов
        if (missing_file.scan)
          disable_file_link('scan');
        else
          enable_file_link(self.id, 'scan');

        if (missing_file.act)
          disable_file_link('act');
        else
          enable_file_link(self.id, 'act');

        if (missing_file.instr_off)
          disable_file_link('instr_off');
        else
          enable_file_link(self.id, 'instr_off');

        if (missing_file.instr_rec)
          disable_file_link('instr_rec');
        else
          enable_file_link(self.id, 'instr_rec');

        function disable_file_link(name) {
          modal.find('[data-name="' + name + '"]').parent().addClass("disabled");
        }

        function enable_file_link(id, name) {
          modal.find('[data-name="' + name + '"]').attr('href', '/services/' + id + '/download/' + name);
        }

        //Установка ссылок на кнопки генерации формуляра/акта
        modal.find('[data-name="gen_formular"]').attr('href', '/services/' + self.id + '/generate/formular')
          .end().find('[data-name="gen_act"]').attr('href', '/services/' + self.id + '/generate/act');

        // Отключить переход по ссылке, если файл отсутствует
        modal.find('[data-link-type="download"]').each(function () {
          $(this).off().on('click', function (event) {
            if ($(event.target).parent().hasClass('disabled'))
              event.preventDefault();
          });
        });

        // Ссылка на изменение данных о сервере
        modal.find('a[data-id="changeData"]').attr('href', '/services/' + service.name + '/edit');

        modal.modal('show');
      });

      // Событие после закрытия окна
      // Убрать все отключенные ссылки на скачивание файлов
      modal.on('hidden.bs.modal', function () {
        $(this).find('[data-link-type="download"]').each(function () {
          $(this).parent().removeClass('disabled');
        });
      });
    });
  }

});