class Service < ActiveRecord::Base

  before_save :check_exploitation

  resourcify

  has_many :service_networks, dependent: :destroy
  has_many :storage_systems, dependent: :destroy

  has_many :service_dep_parents, foreign_key: :child_id, class_name: 'ServiceDependency', dependent: :destroy
  has_many :parents, through: :service_dep_parents, source: :parent_service

  has_many :service_dep_childs, foreign_key: :parent_id, class_name: 'ServiceDependency', dependent: :restrict_with_error
  has_many :childs, through: :service_dep_childs, source: :child_service

  belongs_to :contact_1, class_name: 'Contact'
  belongs_to :contact_2, class_name: 'Contact'

  validates :name, presence: true, uniqueness: true

  strip_attributes allow_empty: true, collapse_spaces: true

  accepts_nested_attributes_for :service_networks, allow_destroy: true, reject_if: proc { |attr| attr['segment'].blank? || attr['vlan'].blank? || attr['dns_name'].blank? }
  accepts_nested_attributes_for :storage_systems, allow_destroy: true, reject_if: proc { |attr| attr['name'].blank? }
  accepts_nested_attributes_for :service_dep_parents, allow_destroy: true, reject_if: proc { |attr| attr['parent_id'].blank? }

  enum priority:  ["Критическая производственная задача", "Вторичная производственная задача", "Тестирование и отладка"]
  enum time_work: ["Круглосуточно (24/7)", "Рабочее время (8/5)", "По запросу"]

  has_attached_file :scan
  has_attached_file :act
  has_attached_file :instr_rec
  has_attached_file :instr_off

  validates_attachment_content_type :scan, content_type: [
    'application/pdf',
    'image/jpg',
    'image/jpeg',
    'image/png'
    # 'application/force-download',
    # 'application/x-file-download'
  ]
  validates_attachment_content_type :act, content_type: [
    'application/pdf',
    'application/msword',
    'image/jpg',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    # 'application/force-download',
    # 'application/x-file-download'
  ]
  validates_attachment_content_type :instr_rec, content_type: [
    'application/pdf',
    'application/msword',
    'image/jpg',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    # 'application/force-download',
    # 'application/x-file-download'
  ]
  validates_attachment_content_type :instr_off, content_type: [
    'application/pdf',
    'application/msword',
    'image/jpg',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    # 'application/force-download',
    # 'application/x-file-download'
  ]

  # Получить всех ответственных
  # type - передается функции get_contact (:formular - для формуляра, :act - для акта)
  def get_contacts(type)
    contacts          = {}
    contacts[:first]  = get_contact(:first, type)
    contacts[:second] = get_contact(:second, type)

    contacts
  end

  # Сгенерировать формуляр/акт
  def generate_rtf(type)

    file = if type == "formular"
      data = { data: self.as_json, contacts: get_contacts(:formular) }
      IO.popen("php #{Rails.root}/lib/generateFormular.php '#{data}'")
           else
      data = { data: self, contacts: get_contacts(:act) }.to_json
      IO.popen("php #{Rails.root}/lib/generateAct.php '#{data}'")
           end
    file.read
  end

  private

  # Установить false, если флаг эксплуатации не установлен
  def check_exploitation
    self.exploitation = 'false' if exploitation.nil?
  end

  # Получить информацию об ответственном за сервис в определенном виде
  # contact - порядок ответственного (:first, :second)
  # type - Необходимый вид возвращаемого значения ():formular - для формуляра, :act - для акта)ы
  def get_contact(contact, type)
    row = ""

    if contact == :first
      return "Отсутствует" if self.contact_1.nil?

      # Получаем ФИО
      info_arr    = self.contact_1.info.split(' ')
      fio = if type == :formular
        "#{info_arr[0]} #{info_arr[1][0]}. #{info_arr[2][0]}."
            else
        "#{info_arr[1][0]}. #{info_arr[2][0]}. #{info_arr[0]}"
            end
      # Получаем отдел
      dept        = self.contact_1.dept
      # Получаем рабочий номер
      work_num    = self.contact_1.work_num
      # Получаем сотовый номер
      mobile_num  = self.contact_1.mobile_num
      # Тип ответственного (основной/замещающий)
      contact_type = " (основной)"
    else
      return "Отсутствует" if self.contact_2.nil?

      # Получаем ФИО
      info_arr    = self.contact_2.info.split(' ')
      fio = if type == :formular
              "#{info_arr[0]} #{info_arr[1][0]}. #{info_arr[2][0]}."
            else
              "#{info_arr[1][0]}. #{info_arr[2][0]}. #{info_arr[0]}"
            end
      # Получаем отдел
      dept        = self.contact_2.dept
      # Получаем рабочий номер
      work_num    = self.contact_2.work_num
      # Получаем сотовый номер
      mobile_num  = self.contact_2.mobile_num
      # Тип ответственного (основной/замещающий)
      contact_type = " (замещающий)"
    end

    row += "#{fio}" if fio
    row += ", отд. #{dept}"

    if type == :formular
      row += ", р.т. #{work_num}" unless work_num.empty?
      row += ", c.т. #{mobile_num}" unless mobile_num.empty?
    else
      row += contact_type
    end

    row
  end

end