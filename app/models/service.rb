class Service < ActiveRecord::Base

  resourcify

  STATUSES = {
    work:     'В работе',
    test:     'В тесте',
    inactive: 'Не используется'
  }.freeze

  before_save :set_deadline
  after_update :update_values_service_for_parents, if: -> { formular_type == false }
  before_destroy :destroy_parents

  has_many :service_networks, dependent: :destroy
  has_many :storage_systems, dependent: :destroy

  has_many :service_dep_parents, foreign_key: :child_id, class_name: 'ServiceDependency', dependent: :restrict_with_error
  has_many :parents, through: :service_dep_parents, source: :parent_service

  has_many :service_dep_childs, foreign_key: :parent_id, class_name: 'ServiceDependency', dependent: :destroy
  has_many :childs, through: :service_dep_childs, source: :child_service

  has_many :service_hostings
  has_many :cluster, through: :service_hostings
  has_many :service_tags, dependent: :destroy
  has_many :tags, through: :service_tags

  belongs_to :contact_1, class_name: 'Contact'
  belongs_to :contact_2, class_name: 'Contact'

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :number, uniqueness: { case_sensitive: false }, allow_blank: true
  validates :priority, :time_work, presence: true
  validates :descr, length: { maximum: 400 }, allow_blank: true, if: -> { new_record? }
  validates :os, length: { maximum: 65 }, allow_blank: true, if: -> { new_record? }
  validates :kernel_count, length: { maximum: 5 }, numericality: { only_integer: true }, allow_blank: true, if: -> { presence_for_request == true }
  validates_numericality_of :frequency, less_than_or_equal_to: 3.9, message: 'должна иметь значение меньшее или равное 3.9', allow_blank: true, if: -> { new_record? && formular_type == false || new_record? && formular_type == true && frequency != 0.0 }
  validates_numericality_of :frequency, greater_than_or_equal_to: 2.0, message: 'должна иметь значение большее или равное 2.0', allow_blank: true, if: -> { new_record? && formular_type == false || new_record? && formular_type == true && frequency != 0.0 }
  validates :memory, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 64 }, allow_blank: true, if: -> { presence_for_request == true }
  validates :disk_space, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 500 }, allow_blank: true, if: -> { presence_for_request == true }
  validates :component_key, length: { maximum: 50 }, allow_blank: true, if: -> { new_record? }
  validates :additional_data, length: { maximum: 500 }, allow_blank: true, if: -> { new_record? }
  validates :name, length: { maximum: 65 }, if: -> { new_record? }

  validates :os, :kernel_count, :frequency, :memory, :disk_space, :component_key, presence: true, if: -> { presence_for_request == true }

  # Empty attributes will not be converted to nil
  # Sequential spaces in attributes will be collapsed to one space
  strip_attributes allow_empty: true, collapse_spaces: true

  accepts_nested_attributes_for :service_networks, allow_destroy: true, reject_if: proc { |attr| attr['segment'].blank? || attr['vlan'].blank? || attr['dns_name'].blank? }
  accepts_nested_attributes_for :storage_systems, allow_destroy: true, reject_if: proc { |attr| attr['name'].blank? }
  # accepts_nested_attributes_for :service_dep_parents, allow_destroy: true, reject_if: proc { |attr| attr['parent_id'].blank? }
  accepts_nested_attributes_for :service_dep_childs, allow_destroy: true, reject_if: proc { |attr| attr['child_id'].blank? }
  accepts_nested_attributes_for :service_tags, allow_destroy: true, reject_if: proc { |attr| attr['tag_id'].blank? }

  enum priority:  ['Критическая производственная задача', 'Вторичная производственная задача', 'Внедрение', 'Отладка']
  enum time_work: ['Круглосуточно (24/7)', 'Рабочее время (8/5)', 'По запросу']
  enum antivirus: { not_installed: 1, enterprise: 2, another_manufacturer: 3, incompatible_software: 4, according_vm: 5 }

  attr_accessor :presence_for_request

  has_attached_file :scan
  has_attached_file :act
  has_attached_file :instr_rec
  has_attached_file :instr_off

  validates_attachment_content_type :scan,
                                    content_type: [
                                      'application/pdf',
                                      'image/jpg',
                                      'image/jpeg',
                                      'image/png'
                                      # 'application/force-download',
                                      # 'application/x-file-download'
                                    ],
                                    message: 'Скан формуляра имеет неверный тип данных'

  validates_attachment_content_type :act,
                                    content_type: [
                                      'application/pdf',
                                      'application/msword',
                                      'image/jpg',
                                      'image/jpeg',
                                      'image/png',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                      # 'application/force-download',
                                      # 'application/x-file-download'
                                    ],
                                    message: 'Скан акта имеет неверный тип данных'

  validates_attachment_content_type :instr_rec,
                                    content_type: [
                                      'application/pdf',
                                      'application/msword',
                                      'image/jpg',
                                      'image/jpeg',
                                      'image/png',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                      # 'application/force-download',
                                      # 'application/x-file-download'
                                    ],
                                    message: 'Инструкция по посстановлению имеет неверный тип данных'

  validates_attachment_content_type :instr_off,
                                    content_type: [
                                      'application/pdf',
                                      'application/msword',
                                      'image/jpg',
                                      'image/jpeg',
                                      'image/png',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                      # 'application/force-download',
                                      # 'application/x-file-download'
                                    ],
                                    message: 'Инструкция по отключению имеет неверный тип данных'

  def update_values_service_for_parents
    parents.each do |parent|
      # Обнуление значений для нового подсчета
      # frequency должен выводить максимальное число, а не сумму всех значений
      obj = {
        kernel_count: 0,
        frequency: 0,
        memory: 0,
        disk_space: 0
      }

      parent.childs.each do |child|
        # Подсчет только для серверов (ВМ)
        next if child.formular_type

        obj[:kernel_count] += child.kernel_count.to_f
        obj[:memory] += child.memory.to_f
        obj[:disk_space] += child.disk_space.to_f

        obj[:frequency] = child.frequency.to_f if obj[:frequency] < child.frequency.to_f
      end

      # Применить обновленный подсчет
      parent.update(
        kernel_count: obj[:kernel_count],
        frequency: obj[:frequency],
        memory: obj[:memory],
        disk_space: obj[:disk_space]
      )
    end
  end

  def destroy_parents
    if parents.present?
      errors.add(:base, :service_dep_parents, parents: parents.map(&:name).join(','))
      throw(:abort)
    end
  end

  # Получает последний номер формуляра и возвращает следующий за ним номер.
  def self.get_next_service_number
    last = 000

    select(:number).each do |s|
      unless s[:number].empty?
        tmp_last  = s[:number].slice(/\d{3}-\d{2}-(\d{3})/, 1)
        last      = tmp_last.to_i if tmp_last.to_i > last
      end
    end

    sprintf('%03d', last.to_i.next)
  end

  def self.antiviri_attributes_for_select(flag_type)
    if flag_type
      [[I18n.t('activerecord.attributes.service.antiviri.according_vm'), 'according_vm']]
    else
      antivirus = []
      antiviri.each do |antiviri, _|
        unless antiviri == 'according_vm'
          antivirus.push([I18n.t("activerecord.attributes.service.antiviri.#{antiviri}"), antiviri])
        end
      end
      antivirus
    end
  end

  # Изменение вывода значений в поле "Режим гарантированной доступности"
  # чтобы "Рабочее время (8/5)" выводился по умолчанию для новой записи
  def self.time_works_attributes_for_select
    arr_time_works = []
    other = []

    time_works.each do |time_work, _|
      if time_work == 'Рабочее время (8/5)'
        arr_time_works.push(time_work)
      else
        other.push(time_work)
      end
    end
    arr_time_works.push(other).flatten
  end

  # Получить всех ответственных
  # type - передается функции get_contact (:formular - для таблицы формуляра в виде строки, :obj - в виде объектов)
  def get_contacts(type)
    contacts = {}

    if type == :formular
      contacts[:first]  = get_contact :first, :formular
      contacts[:second] = get_contact :second, :formular
    else
      contacts[:first]  = self.contact_1
      contacts[:second] = self.contact_2
    end

    contacts
  end

  # Сгенерировать формуляр/акт
  #
  # type - тип файла (formulat - формуляр, act - акт)
  def generate_rtf(type)
    # Начальник отдела ответственного за сервис (пустая строка, если не определен в базе)
    head = if self.contact_1.nil? || self.contact_2.nil? || self.contact_1.department_head.nil?
             ''
           else
             short_name self.contact_1.department_head.info, :act
           end

    antiviri = antivirus.present? ? I18n.t("activerecord.attributes.service.antiviri.#{antivirus}") : ''

    if type == 'formular'
      data = {
        data: self,
        contact_strings: get_contacts(:formular),
        contact_objects: get_contacts(:obj),
        networks: self.service_networks,
        ports: self.get_ports,
        storages: self.storage_systems,
        head: head,
        antiviri: antiviri
      }.to_json

      file = IO.popen("php #{Rails.root}/lib/generateFormular.php '#{data}'")
    elsif type == 'act'
      data = {
        data: self,
        contact_objects: get_contacts(:obj),
        head: head
      }.to_json

      file = IO.popen("php #{Rails.root}/lib/generateAct.php '#{data}'")
    else
      return
    end

    file.read
  end

  # Возвращает массив строк с подключениями к сети
  # Если количество подключений к сети < 2, добавить пустые строки
  def get_service_networks
    networks = []

    if self.service_networks.length < 2
      2.times do |i|
        networks[i] = get_network_string(self.service_networks[i])
      end
    else
      self.service_networks.length.times do |i|
        networks[i] = get_network_string(self.service_networks[i])
      end
    end

    networks
  end

  # Возвращает массив строк с подключениями к СХД
  # Если количество подключений к сети < 2, добавить пустые строки
  def get_service_storages
    storages = []

    if self.storage_systems.length < 2
      2.times do |i|
        storages[i] = get_storage_string(self.storage_systems[i])
      end
    else
      self.storage_systems.length.times do |i|
        storages[i] = get_storage_string(self.storage_systems[i])
      end
    end

    storages
  end

  # Возвращает номер формуляра, если он существует.
  def get_service_number
    if self.number.empty?
      "Номер формуляра отсутствует"
    else
      "Формуляр № ***REMOVED***-Ф-#{self.number}"
    end
  end

  # Возвращает объект вида { local: Имя + Список портов, доступных в ЛС, inet: Имя + Список портов, доступных из Интернет }
  def get_ports
    ports = {
      local:  '',
      inet:   ''
    }

    self.service_networks.each do |net|
      next if net.service_port.nil?

      # Если VLAN в диапазоне от 1 до 4094, получить список открытых портов, доступных из ЛС.
      if net.vlan.to_i >= 1 && net.vlan.to_i <= 4094
        local = get_local_ports(net.service_port)
        ports[:local] += "#{net.dns_name}: #{local}; " unless local.empty?
      end

      # Получить список открытых портв, доступных из сети Интернет
      inet = get_inet_ports(net.service_port)
      ports[:inet] += "#{net.dns_name}: #{inet}; " unless inet.empty?
    end

    ports
  end

  private

  # Возвращает ФИО взависимости от того, какой type указан
  #
  # footer - "И. О. Фамилия"
  # остальное - "Фамилия И. О."
  def short_name(fio, type)
    fio_arr = fio.split(' ')
    if type == :act
      "#{fio_arr[1][0]}. #{fio_arr[2][0]}. #{fio_arr[0]}"
    elsif type == :formular
      "#{fio_arr[0]} #{fio_arr[1][0]}. #{fio_arr[2][0]}."
    end
  end

  # Получить информацию об ответственном за сервис в виде:
  # Денисов Д. Д., отд. ХХХ, р.т. ХХ-ХХ, с.т. Х-ХХХ-ХХХ-ХХ-ХХ
  #
  # contact - порядок ответственного (:first, :second)
  # type - Необходимый вид возвращаемого значения (:formular - для формуляра, :act - для акта)
  def get_contact(contact, type)
    row = ""

    if contact == :first
      return "Отсутствует" if self.contact_1.nil?

      # Получаем ФИО
      fio           = short_name self.contact_1.info, type
      # Получаем отдел
      dept          = self.contact_1.dept
      # Получаем рабочий номер
      work_num      = self.contact_1.work_num
      # Получаем сотовый номер
      mobile_num    = self.contact_1.mobile_num
      # Тип ответственного (основной/замещающий)
      contact_type  = " (основной)"
    else
      return "Отсутствует" if self.contact_2.nil?

      # Получаем ФИО
      fio           = short_name self.contact_2.info, type
      # Получаем отдел
      dept          = self.contact_2.dept
      # Получаем рабочий номер
      work_num      = self.contact_2.work_num
      # Получаем сотовый номер
      mobile_num    = self.contact_2.mobile_num
      # Тип ответственного (основной/замещающий)
      contact_type  = " (замещающий)"
    end

    row += "#{fio}" if fio
    row += ", отд. #{dept}"

    if type == :formular
      row += ", р.т. #{work_num}" unless work_num.blank?
      row += ", c.т. #{mobile_num}" unless mobile_num.blank?
    else
      row += contact_type
    end

    row
  end

  # Возвращает либо пустую строку (если подключение к сети отсутсвутет), либо строку вида
  # "segment, vlan, dns_name"
  def get_network_string(network)
    if network.nil?
      ''
    else
      "#{network['segment']}, #{network['vlan']}, #{network['dns_name']}"
    end
  end

  # Возвращает либо пустую строку (если подключение к сети отсутсвутет), либо имя подключения к СХД
  def get_storage_string(storage)
    if storage.nil?
      ''
    else
      storage.name
    end
  end

  # Получить строку вида "<Имя>: <Список откр. портов>/tcp, <Список откр. портов>/udp;"
  def get_local_ports(value)
    tmp   = []

    tmp << set_port_suffix(value.local_tcp_ports, :tcp) unless value.local_tcp_ports.empty?
    tmp << set_port_suffix(value.local_udp_ports, :udp) unless value.local_udp_ports.empty?

    tmp.join(", ")
  end

  # Получить строку вида "<Имя>: <Список откр. портов>/tcp, <Список откр. портов>/udp;"
  def get_inet_ports(value)
    tmp   = []

    tmp << set_port_suffix(value.inet_tcp_ports, :tcp) unless value.inet_tcp_ports.empty?
    tmp << set_port_suffix(value.inet_udp_ports, :udp) unless value.inet_udp_ports.empty?

    tmp.join(", ")
  end

  # Установть tcp/udp суффикс к указанным портам
  # data - Строка, содержащая список портов и прошедшая фильтрация через функцию _filterPorts
  # suffix - Строка, содержщая суффикс(tcp, udp), который необходимо добавить к портам, указанным в data
  def set_port_suffix(data, suffix)
    return if data.empty?

    data.gsub!(/(\d+ {0,1}- {0,1}\d+)[, ]*/, '\1/' + suffix.to_s + ', ')
    data.gsub!(/(\d+)([^\/ *\-\d+] *)/, '\1/' + suffix.to_s + ', ')
    data.gsub!(/(\d+),{0,1} {0,1}$/, '\1/' + suffix.to_s)

    if suffix == :tcp
      data.gsub!(/(\d+\/tcp),{0,1} {0,1}$/, '\1')
    else
      data.gsub!(/(\d+\/udp),{0,1} {0,1}$/, '\1')
    end
  end

  # Установить в поле test_date значение nil, если приоритет не равен "Внедрение"
  def set_deadline
    self.deadline = nil unless self.priority == 'Внедрение'
  end
end
