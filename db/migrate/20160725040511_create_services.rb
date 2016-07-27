class CreateServices < ActiveRecord::Migration
  def change
    create_table :services do |t|
      t.string  :number,              limit: 20                      # Номер формуляра
      t.string  :dept,                index: true, limit: 10         # Отдел
      t.string  :name,                index: true                    # Наименование сервиса
      t.text    :descr                                               # Описание
      t.integer :priority                                            # Приоритет функционирования (тип enum)
      t.integer :time_work                                           # Режим доступности (тип enum)
      t.string  :max_time_rec                                        # Макс время восстановления
      t.integer :contact_1_id                                        # Основной ответственный
      t.integer :contact_2_id                                        # Вторичный контакт

      t.text    :environment                                         # Среда исполнения
      t.string  :os                                                  # Операционная система
      t.string  :component_key                                       # Ключевой программный компонент
      t.string  :kernel_count                                        # Кол-во ядер процессора
      t.string  :frequency                                           # Тактовая частота процессора
      t.string  :memory                                              # Объем оперативной памяти
      t.string  :disk_space                                          # Объем дискового пространства
      t.string  :hdd_speed                                           # Скорость обмена с жестким диском
      t.string  :network_speed                                       # Скорость сетевого соединения
      t.text    :additional_require                                  # Дополнительные требования к среде исполнения

      t.text    :backup_manual                                       # Описание процедуры рез. копирования
      t.text    :recovery_manual                                     # Описание процедуры восст. данных
      t.string  :value_backup_data                                   # Объем данных для копирования
      t.string  :storage_time                                        # Срок хранения старейшей копии
      t.string  :store_copies                                        # Хранилище резервных копий
      t.string  :backup_volume                                       # Оценка объема резервной копии
      t.string  :backup_window                                       # Окно резервного копирования
      t.string  :time_recovery                                       # Время восстановления данных

      t.string  :duplicate_ps                                        # Дублирование блоков питания
      t.string  :raid                                                # RAID-массив
      t.string  :bonding                                             # Агрегация сетевых портов
      t.string  :other                                               # Другое
      t.string  :resiliency                                          # Обеспечение отказоустойчивости
      t.string  :time_after_failure                                  # Время восстановления после отказа
      t.string  :disaster_rec                                        # Обеспечение катастрофойстойчивости
      t.string  :time_after_disaster                                 # Время возобновления после катастрофы

      t.string  :antivirus                                           # Антивирусные средства
      t.string  :firewall                                            # Межсетевое экранирование
      t.string  :uac_app_selinux                                     # UAC/AppArmor/SELinux
      t.string  :szi                                                 # Сертифицированные СЗИ НСД
      t.string  :internet                                            # Доступ в интернет
      t.text    :tcp_ports                                           # Сетевые tcp порты, доступые из ЛС
      t.text    :udp_ports                                           # Сетевые udp порты, доступые из ЛС
      t.text    :inet_tcp                                            # Сетевые tcp порты, доступые из Интернет
      t.text    :inet_udp                                            # Сетевые udp порты, доступые из Интернет

      t.string  :type_mon                                            # Метод мониторинга доступности сервиса
      t.string  :service_mon                                         # Мониторинг доступности сервиса
      t.string  :hardware_mon                                        # Мониторинг работы аппаратных средств
      t.string  :security_mon                                        # Мониторинг безопасности

      t.text    :additional_data                                     # Дополнительные данные

      # t.string link_scan # Ссылка на скан
      # t.string link_act # Ссылка на акт
      # t.string link_inst_rec # Ссылка на инструкцию
      t.boolean :has_instr_rec                                       # Наличие инструкции по восстановлению
      # t.string link_instr_off
      t.boolean :has_instr_off                                       # Наличие инструкции по отключению
      t.boolean :exploitation

      t.text    :comment                                             # Комментарий
      t.string  :name_monitoring                                     # Имя в системе мониторинга


      t.timestamps null: false
    end
  end
end
